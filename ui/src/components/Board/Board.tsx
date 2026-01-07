import type { BoardStatus } from "../../types/Game";
import Square from "../Square/Square";

function Board({
  squares,
  handleCellClick,
}: {
  squares: BoardStatus;
  handleCellClick: (i: number) => void;
}) {
  return (
    <>
      {squares?.map((square, index) => (
        <Square
          index={index}
          square={square}
          handleCellClick={handleCellClick}
        ></Square>
      ))}
    </>
  );
}

export default Board;
