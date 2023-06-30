import { create } from './services/user.service.js';

const createUser = async () => {
  try {
    console.log('creating users...');

    create({ username: 'jackday1', password: 'Asdfgh1@3' });
    create({ username: 'jackday2', password: 'Asdfgh1@3' });

    console.log('created users');
  } catch (err) {
    console.error('create user error', err);
  }
};

const main = async () => {
  await createUser();
};

main();
