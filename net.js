// Links between devices for multiplayer games (Phil, 29 October 2026). One device hosts: it
// holds the game and gets a short code; the others join with the code. Devices find each other
// through the free PeerJS service, then talk directly over the network (WebRTC). PeerJS is
// loaded only when a game is hosted or joined, so the rest of the app never depends on it.
//
// A link: { role: "host" | "client", code, send(seat, message), onMessage(handler), close() }.
// The host sends to a seat (send(seat, message)) and its handler gets (message, seat); a
// client sends to the host (send(null, message)) and gets (message). Messages are plain JSON.
// Before the game starts the host also tells the lobby who has joined (onPlayers).

const PEERJS_URL = "https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js";
const ID_PREFIX = "mech-attack-game-";
// Codes avoid letters that are easy to confuse (I, O).
const CODE_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const CODE_LENGTH = 4;
const CLIENT_KEY = "mech-attack.client-id";
const CONNECT_TIMEOUT_MS = 15000;

let peerLibrary = null;

// Loads PeerJS once, from its CDN.
function loadPeer() {
  peerLibrary ||= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PEERJS_URL;
    script.onload = () => resolve(window.Peer);
    script.onerror = () => {
      peerLibrary = null;
      reject(new Error("Could not load the networking library. Is this device online?"));
    };
    document.head.appendChild(script);
  });
  return peerLibrary;
}

function randomCode() {
  return Array.from({ length: CODE_LENGTH },
    () => CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)]).join("");
}

// This device's id, kept so it gets its seat back if it rejoins after a dropped connection.
function clientId() {
  try {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  }
}

// Opens a peer with the given id (or any id), resolving once it is registered.
async function openPeer(id) {
  const Peer = await loadPeer();
  return new Promise((resolve, reject) => {
    const peer = id ? new Peer(id) : new Peer();
    const timer = setTimeout(() => reject(new Error("Timed out reaching the game service.")),
      CONNECT_TIMEOUT_MS);
    peer.on("open", () => {
      clearTimeout(timer);
      resolve(peer);
    });
    peer.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

// Hosts a game for the given remote seats. onPlayers(joined) is told which seats have a
// device: [seat, ...]. Seats are handed out in order to devices as they join; a device that
// rejoins gets its old seat back (and, once the game has started, onRejoin(seat) is called so
// the game can send it the game again).
export async function hostGame({ remoteSeats, onPlayers = () => {} }) {
  let peer = null;
  let code = null;
  for (let attempt = 0; !peer; attempt++) {
    code = randomCode();
    try {
      peer = await openPeer(ID_PREFIX + code);
    } catch (error) {
      // The code is taken: try another. Anything else is a real failure.
      if (error.type !== "unavailable-id" || attempt > 4) throw error;
    }
  }
  const connections = new Map(); // seat -> connection
  const owners = new Map(); // client id -> seat
  let handler = () => {};
  const link = {
    role: "host",
    code,
    onRejoin: null,
    send(seat, message) {
      const conn = connections.get(seat);
      if (conn && conn.open) conn.send(message);
    },
    onMessage(fn) {
      handler = fn;
    },
    joined: () => [...connections.keys()],
    close() {
      peer.destroy();
    },
  };
  peer.on("connection", (conn) => {
    conn.on("data", (message) => {
      if (message && message.type === "hello") {
        let seat = owners.get(message.clientId);
        if (seat === undefined) {
          seat = remoteSeats.find((s) => ![...owners.values()].includes(s));
        }
        if (seat === undefined) {
          conn.send({ type: "full" });
          return;
        }
        owners.set(message.clientId, seat);
        connections.set(seat, conn);
        conn.seat = seat;
        conn.send({ type: "welcome", seat });
        onPlayers(link.joined());
        if (link.onRejoin) link.onRejoin(seat);
        return;
      }
      if (conn.seat !== undefined) handler(message, conn.seat);
    });
    conn.on("close", () => {
      if (connections.get(conn.seat) === conn) connections.delete(conn.seat);
      onPlayers(link.joined());
    });
  });
  return link;
}

// Joins the game with this code. Resolves once the host has given this device a seat:
// { link, seat }. Messages the host sends after that go to the link's handler (the lobby
// waits for "start"); if the connection drops, the handler gets { type: "closed" }.
export async function joinGame(code) {
  const peer = await openPeer(null);
  const conn = peer.connect(ID_PREFIX + code.trim().toUpperCase(), { reliable: true });
  let handler = () => {};
  const link = {
    role: "client",
    code,
    send(_, message) {
      if (conn.open) conn.send(message);
    },
    onMessage(fn) {
      handler = fn;
    },
    close() {
      peer.destroy();
    },
  };
  const seat = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`No game found with code ${code}.`)),
      CONNECT_TIMEOUT_MS);
    peer.on("error", (error) => {
      clearTimeout(timer);
      reject(error.type === "peer-unavailable" ? new Error(`No game found with code ${code}.`)
        : error);
    });
    conn.on("open", () => conn.send({ type: "hello", clientId: clientId() }));
    conn.on("data", (message) => {
      if (message.type === "welcome") {
        clearTimeout(timer);
        resolve(message.seat);
      } else if (message.type === "full") {
        clearTimeout(timer);
        reject(new Error("That game has no free seat."));
      } else {
        handler(message);
      }
    });
    conn.on("close", () => handler({ type: "closed" }));
  });
  return { link, seat };
}
