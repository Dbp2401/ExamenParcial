//fromModelToAutor fromModelToLibro

import type { LibroModel, Libro, Autor, AutorModel } from "./types.ts";
import { Collection } from "mongodb";

export const fromModelToLibro = async (libroDB:LibroModel, authorsCollection:Collection<AutorModel>):Promise<Libro> =>{
    const autores = await authorsCollection.find({id:{$in:libroDB.authors}}).toArray()
    return {
        id:libroDB._id!.toString(),
        title:libroDB.title,
        copies:libroDB.copies,
        authors:autores.map((u)=>fromModelToAutor(u))
    }
}

export const fromModelToAutor =  (autorDB:AutorModel):Autor => {
    return {
        name:autorDB.name,
        descr:autorDB.descr,
        id:autorDB._id!.toString()
    }
}