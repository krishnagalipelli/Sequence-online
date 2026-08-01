import React from 'react';

const suitSymbols = {
  'S': '♠',
  'H': '♥',
  'C': '♣',
  'D': '♦'
};

const suitColors = {
  'S': 'black',
  'H': 'red',
  'C': 'black',
  'D': 'red'
};

function formatCard(cardCode) {
  if (cardCode === 'WILD') return { rank: 'W', suit: '★', color: 'orange' };
  
  const rank = cardCode[0];
  const suit = cardCode[1];
  
  return {
    rank: rank === 'T' ? '10' : rank,
    suit: suitSymbols[suit] || suit,
    color: suitColors[suit] || 'black'
  };
}

function Board({ gameState, playerId, onPlayMove }) {
  if (!gameState || !gameState.boardLayout) return null;

  const { boardLayout, boardState, players, turn, winner, myHand } = gameState;
  const isMyTurn = !winner && players[turn] === playerId;

  const handleCellClick = (r, c) => {
    if (!isMyTurn) return;
    
    // Simple UI: we click a cell, and if it's a valid move, we send it.
    // Wait, the player needs to choose which card to play.
    // If they have the exact card, they can play it.
    // If they want to use a Two-Eyed Jack, how do we know they are playing the Jack and not the actual card if they happen to have both?
    // Actually, usually in Sequence online, you select a card from your hand first, THEN click the board.
    // But since this is a simplified version, let's just find the best card.
    // If they have the exact card, use it.
    // If they don't, check if they have a Two-Eyed Jack and the cell is empty.
    // If the cell has an opponent chip, check if they have a One-Eyed Jack.
    
    const boardCard = boardLayout[r][c];
    const currentChip = boardState[r][c];
    let cardToPlay = null;

    if (boardCard !== 'WILD') {
      if (currentChip === null) {
        // Can we play standard?
        if (myHand.includes(boardCard)) {
          cardToPlay = boardCard;
        } else {
          // Can we play two-eyed jack?
          const twoEyed = ['JD', 'JC'].find(j => myHand.includes(j));
          if (twoEyed) cardToPlay = twoEyed;
        }
      } else {
        // Space is occupied
        const myIndex = players.indexOf(playerId);
        if (currentChip !== myIndex) {
          // Can we play one-eyed jack?
          const oneEyed = ['JS', 'JH'].find(j => myHand.includes(j));
          if (oneEyed) cardToPlay = oneEyed;
        }
      }
    }

    if (cardToPlay) {
      onPlayMove(cardToPlay, r, c);
    } else {
      // Could show a brief error like "Invalid move or no matching card in hand"
    }
  };

  return (
    <div className="board-container">
      <div className="board">
        {boardLayout.map((row, rIndex) => (
          row.map((cell, cIndex) => {
            const card = formatCard(cell);
            const chipValue = boardState[rIndex][cIndex];
            
            let chipClass = '';
            if (chipValue === 0) chipClass = 'chip p0-chip';
            if (chipValue === 1) chipClass = 'chip p1-chip';
            if (chipValue === 2) chipClass = 'chip p2-chip';

            // Determine if playable to highlight
            const isPlayable = isMyTurn && (() => {
              if (cell === 'WILD') return false;
              if (chipValue === null) {
                return myHand.includes(cell) || myHand.some(c => ['JD', 'JC'].includes(c));
              } else if (chipValue !== players.indexOf(playerId)) {
                return myHand.some(c => ['JS', 'JH'].includes(c));
              }
              return false;
            })();

            const hasMatchingCard = myHand.includes(cell) && chipValue === null;

            return (
              <div 
                key={`${rIndex}-${cIndex}`} 
                className={`board-cell ${isPlayable ? 'playable' : ''} ${hasMatchingCard ? 'highlight-match' : ''}`}
                onClick={() => handleCellClick(rIndex, cIndex)}
              >
                <div className={`card-content ${card.color}`}>
                  <span className="rank">{card.rank}</span>
                  <span className="suit">{card.suit}</span>
                </div>
                {chipClass && <div className={chipClass} />}
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
}

export default Board;
