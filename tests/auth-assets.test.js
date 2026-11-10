// Integration tests against the real Express routes and in-memory database.
const request = require('supertest');
const { ethers } = require('ethers');
const app = require('../src/server/server');
const payload = {
  title: 'Test asset', description: 'A description longer than ten characters',
  category: 'art', price: { amount: 100, currency: 'USDT' }
};

describe('API authentication and asset owner', () => {
  test('guest and invalid JWT cannot create assets', async () => {
    expect((await request(app).post('/api/assets').send(payload)).status).toBe(401);
    expect((await request(app).post('/api/assets').set('Authorization', 'Bearer invalid').send(payload)).status).toBe(401);
  });
  test('email registration and sign-in issue a usable identity', async () => {
    const email = `auth-${Date.now()}@example.com`;
    const registered = await request(app).post('/api/auth/register')
      .send({ email, password: 'Password123!', name: 'Auth Test' });
    expect(registered.status).toBe(201);
    const loggedIn = await request(app).post('/api/auth/login')
      .send({ email, password: 'Password123!' });
    expect(loggedIn.status).toBe(200);
    const profile = await request(app).get('/api/auth/profile')
      .set('Authorization', `Bearer ${loggedIn.body.token}`);
    expect(profile.status).toBe(200);
    expect(profile.body.id).toBe(registered.body.user.id);
  });
  test('signed wallet login issues JWT and owner cannot be forged', async () => {
    const wallet = ethers.Wallet.createRandom();
    const challenge = await request(app).post('/api/auth/wallet/challenge').send({ address: wallet.address });
    expect(challenge.status).toBe(200);
    const signature = await wallet.signMessage(challenge.body.message);
    const login = await request(app).post('/api/auth/wallet/verify').send({ address: wallet.address, signature });
    expect(login.status).toBe(200);
    expect(login.body.token).toEqual(expect.any(String));
    const response = await request(app).post('/api/assets')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ ...payload, ownerId: 'victim', owner: { id: 'victim', name: 'Victim' }, isVerified: true, status: 'validated' });
    expect(response.status).toBe(201);
    expect(response.body.owner.id).toBe(login.body.user.id);
    expect(response.body.ownerId).toBe(login.body.user.id);
    expect(response.body.isVerified).toBe(false);
    expect(response.body.status).toBe('pending');
    const replay = await request(app).post('/api/auth/wallet/verify').send({ address: wallet.address, signature });
    expect(replay.status).toBe(401);
  });
});
