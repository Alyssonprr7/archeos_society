import { createBrowserRouter } from "react-router";
import Lobby from "./pages/Lobby";
import Join from "./pages/Join";
import Setup from "./pages/Setup";
import Game from "./pages/Game";
import Expedition from "./pages/Expedition";
import SeasonEnd from "./pages/SeasonEnd";
import GameEnd from "./pages/GameEnd";

export const router = createBrowserRouter([
  { path: "/", Component: Lobby },
  { path: "/join", Component: Join },
  { path: "/setup", Component: Setup },
  { path: "/game", Component: Game },
  { path: "/expedition", Component: Expedition },
  { path: "/season-end", Component: SeasonEnd },
  { path: "/game-end", Component: GameEnd },
]);
