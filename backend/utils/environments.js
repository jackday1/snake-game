import * as dotenv from 'dotenv';

dotenv.config();

const environments = {
  PORT: process.env.PORT,
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
};

export default environments;
