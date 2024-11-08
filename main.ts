import { MongoClient, ObjectId } from "mongodb";
import { fromModelToLibro } from "./utils.ts";
import type { LibroModel, AutorModel, Libro, Autor } from "./types.ts";

// Connection URL
const url = Deno.env.get("MONGO_URL");
if (!url) {
  console.error("URL is not set");
  Deno.exit(1);
}
const client = new MongoClient(url);

// Use connect method to connect to the server
await client.connect();
console.log("Connected successfully to server");

// Database Name
const dbName = "ExamenParcial";
const db = client.db(dbName);
//Coleccion
const librosCollection = db.collection<LibroModel>("libros");
const autoresCollection = db.collection<AutorModel>("autores");

const handler = async (req: Request): Promise<Response> => {
  const method = req.method;
  const url = new URL(req.url);
  const path = url.pathname;
  if (method === "GET") {
    if (path === "/libros") {
      const title = url.searchParams.get("title");
      if (title) {
        const libroDB = await librosCollection.find({ title }).toArray();
        const libros = await Promise.all(
          libroDB.map((u) => fromModelToLibro(u, autoresCollection))
        );
        return new Response(JSON.stringify(libros));
      } else {
        const libroDB = await librosCollection.find().toArray();
        const libros = await Promise.all(
          libroDB.map((u) => fromModelToLibro(u, autoresCollection))
        );
        return new Response(JSON.stringify(libros));
      }
    } else if (path === "/libro") {
      const id = url.searchParams.get("id");
      if (!id) return new Response("Bad request", { status: 400 });
      const libroDB = await librosCollection.findOne({ id: id });
      const libro = fromModelToLibro(libroDB as LibroModel, autoresCollection);
      return new Response(JSON.stringify(libro));
    }
  } else if (method === "POST") {
    if (path === "/libro") {
      const libro = await req.json();
      if (!libro.title || !libro.copies || !libro.authors)
        return new Response("Bad request", { status: 400 });
      if(libro === await librosCollection.findOne({libro}))return new Response("Libro already exists",{status:409})
      const { insertedId } = await librosCollection.insertOne({
        title: libro.title,
        copies: libro.copies,
        authors: [],
        _id: libro.id,
      });
      return new Response("Libro creado exitosamente " +
        JSON.stringify(
            {
              title: libro.title,
              copies: libro.copies,
              authors: [],
              _id: insertedId,
            }
        ),
        { status: 201 }
      );
    } else if (path === "/autor") {
        const autor = await req.json();
        if (!autor.name || !autor.descr)
          return new Response("Bad request", { status: 400 });
        const { insertedId } = await autoresCollection.insertOne({
          name: autor.name,
          descr: autor.descr,
          _id: autor.id,
        });
        return new Response(
          JSON.stringify(
            "Autor creado exitosamente" +
              {
                name: autor.name,
                descr: autor.descr,
                _id: insertedId,
              }
          ),
          { status: 201 }
        );
    }
  } else if (method === "PUT") {
    if (path === "/libro") {
      const libro = await req.json();
      if (!libro.title || !libro.copies || !libro.authors)
        return new Response("Bad request", { status: 400 });
      if (libro.authors) {
        const autores = await autoresCollection
          .find({ _id: { $in: libro.authors.map((u:string)=>new ObjectId(u))}})
          .toArray();
        if (autores.length !== libro.authors.length)
          return new Response("Authors not found");
      }
      const { modifiedCount } = await librosCollection.updateOne(
        { _id: libro.id },
        {
          $set: {
            title: libro.title,
            copies: libro.copies,
            authors: libro.authors,
            _id: libro.id,
          },
        }
      );
      if (modifiedCount === 0)
        return new Response("Libro not found", { status: 404 });
      return new Response(
        JSON.stringify(
          "Libro actualizado exitosamente" +
            {
              title: libro.title,
              copies: libro.copies,
              authors: libro.authors,
              _id: libro.id,
            }
        ),
        { status: 200 }
      );
    }
  } else if (method === "DELETE") {
    if (path === "/libro") {
      const id = url.searchParams.get("id");
      if (!id) return new Response("Bad request", { status: 400 });
      const { deletedCount } = await librosCollection.deleteOne({ id:new ObjectId(id) });
      if (deletedCount === 0)
        return new Response("Libro no encontrado", { status: 404 });
      return new Response("Libro Borrado exitosamente", { status: 200 });
    }
  }

  return new Response("Endpoint not found", { status: 404 });
};
Deno.serve({ port: 3000 }, handler);
