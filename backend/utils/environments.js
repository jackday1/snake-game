import * as dotenv from 'dotenv';

dotenv.config();

const environments = {
  PORT: process.env.PORT,
  JWT_SECRET_KEY: process.env.JWT_SECRET_KEY,
  JWT_TOKEN_LIFE: process.env.JWT_TOKEN_LIFE,
};

export default environments;
