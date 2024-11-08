//libro, libroModel, autor, autorModel

import type { ObjectId } from "mongodb";

export type Libro = {
  id: string;
  title: string;
  copies: number;
  authors: Autor[];
};

export type Autor = {
  id: string;
  name: string;
  descr: string;
};

export type AutorModel = {
  _id: ObjectId;
  name: string;
  descr: string;
};

export type LibroModel = {
  _id: ObjectId;
  title: string;
  copies: number;
  authors: ObjectId[];
};
