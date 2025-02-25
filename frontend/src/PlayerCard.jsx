import { useContext } from "react";
import { UserContext } from "./App";

// eslint-disable-next-line react/prop-types
function PlayerCard({playerName, imageUrl}) {
  const defaultName = playerName || useContext(UserContext).userData.username;
  return (
    <div className="card">
      <img
        src={imageUrl}
        className="card-img-top"
        alt="..."
      />
      <div className="card-body">
        <h5 className="card-title">{defaultName}</h5>
        <p>Sunt {defaultName} si voi castiga!</p>
      </div>
    </div>
  );
}

export default PlayerCard;
