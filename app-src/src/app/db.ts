import { DBSchema } from '@ngrx/db';

export const schema: DBSchema = {
  version: 1,
  name: 'books_app',
  stores: {
    books: {
      autoIncrement: true,
      primaryKey: 'id',
    },
  },
};
