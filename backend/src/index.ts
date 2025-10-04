import type WebSocket from "ws";
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

let senderSocket: null | WebSocket = null;
let receiverSocket: null | WebSocket = null;

wss.on("connection", (ws) => {
	console.log("new websocket connection");

	ws.on("error", console.error);

	ws.on("message", (data: any) => {
		const message = JSON.parse(data);
		if (message.type === "sender") {
			console.log("sender set");
			senderSocket = ws;
		} else if (message.type === "receiver") {
			console.log("receiver set");
			receiverSocket = ws;
		} else if (message.type === "createOffer") {
			console.log("offer received");
			if (ws != senderSocket) {
				console.log("createOffer: message not from senderSocket - ignoring");
				return;
			}

			if (!receiverSocket) {
				console.log("createOffer: no receiver connected, dropping offer");
				return;
			}

			receiverSocket.send(
				JSON.stringify({ type: "createOffer", sdp: message.sdp })
			);
		} else if (message.type === "createAnswer") {
			console.log("answer received");
			if (ws !== receiverSocket) {
				console.log(
					"createAnswer: message not from the registered receiver socket - ignoring"
				);
				return;
			}

			if (!senderSocket) {
				console.log("createAnswer: no sender connected, dropping answer");
				return;
			}

			senderSocket.send(
				JSON.stringify({ type: "createAnswer", sdp: message.sdp })
			);
		} else if (message.type === "iceCandidate") {
			if (ws === senderSocket) {
				receiverSocket?.send(
					JSON.stringify({ type: "iceCandidate", candidate: message.candidate })
				);
			} else if (ws === receiverSocket) {
				senderSocket?.send(
					JSON.stringify({ type: "iceCandidate", candidate: message.candidate })
				);
			}
		}

		console.log(message);
	});

	// ws.send("something");
});
