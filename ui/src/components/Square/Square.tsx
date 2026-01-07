import type { Player } from "../../types/Game";

function Square({
  index,
  square,
  handleCellClick,
}: {
  index: number;
  square: Player;
  handleCellClick: (index: number) => void;
}) {
  return (
    <button
      className="game-square"
      key={index}
      onClick={() => handleCellClick(index)}
    >
      {square}
    </button>
  );
}

export default Square;
