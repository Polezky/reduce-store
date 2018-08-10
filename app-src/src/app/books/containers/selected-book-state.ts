import { Clone } from "reduce-store";
import { Book } from "src/app/books/models/book";

export class SelectedBookState extends Clone<SelectedBookState> {
  book: Book;
}
