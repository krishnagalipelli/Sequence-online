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
  const rank = cardCode[0];
  const suit = cardCode[1];
  
  let displayName = rank === 'T' ? '10' : rank;
  let type = 'standard';

  if (['JD', 'JC'].includes(cardCode)) {
    type = 'two-eyed-jack';
    displayName = 'J (Wild)';
  } else if (['JS', 'JH'].includes(cardCode)) {
    type = 'one-eyed-jack';
    displayName = 'J (Remove)';
  }
  
  return {
    code: cardCode,
    rank: displayName,
    suit: suitSymbols[suit] || suit,
    color: suitColors[suit] || 'black',
    type
  };
}

function Hand({ cards, isMyTurn }) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className={`hand-container ${isMyTurn ? 'active-turn' : ''}`}>
      <h3>Your Cards</h3>
      <div className="cards-wrapper">
        {cards.map((cardCode, idx) => {
          const card = formatCard(cardCode);
          return (
            <div key={idx} className={`hand-card ${card.color} ${card.type}`}>
              <div className="card-top">
                <span className="rank">{card.rank}</span>
                <span className="suit">{card.suit}</span>
              </div>
              <div className="card-center">
                <span className="suit">{card.suit}</span>
              </div>
              <div className="card-bottom">
                <span className="suit">{card.suit}</span>
                <span className="rank">{card.rank}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Hand;
