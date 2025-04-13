import { User } from '@prisma/__generated__';

export const extractUserPassword = (user: User): Omit<User, 'password'> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...restUserFields } = user;

  return restUserFields;
};
