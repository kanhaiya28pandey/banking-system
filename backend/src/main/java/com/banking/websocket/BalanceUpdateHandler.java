package com.banking.websocket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.AbstractWebSocketHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class BalanceUpdateHandler extends AbstractWebSocketHandler {

    private Map<String, WebSocketSession> userSessions = new ConcurrentHashMap<>();
    private ObjectMapper mapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String userId = extractUserIdFromSession(session);
        if (userId != null) {
            userSessions.put(userId, session);
            System.out.println("WebSocket connected for user: " + userId);
        }
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            String payload = message.getPayload();
            // Optionally process incoming messages (e.g., subscriptions)
            System.out.println("Received: " + payload);
        } catch (Exception e) {
            System.err.println("Error handling message: " + e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus closeStatus) throws Exception {
        String userId = extractUserIdFromSession(session);
        if (userId != null) {
            userSessions.remove(userId);
            System.out.println("WebSocket disconnected for user: " + userId);
        }
    }

    public void broadcastBalance(String userId, Map<String, Object> balanceData) {
        WebSocketSession session = userSessions.get(userId);
        if (session != null && session.isOpen()) {
            try {
                String message = mapper.writeValueAsString(balanceData);
                session.sendMessage(new TextMessage(message));
            } catch (IOException e) {
                System.err.println("Error broadcasting balance: " + e.getMessage());
                userSessions.remove(userId);
            }
        }
    }

    private String extractUserIdFromSession(WebSocketSession session) {
        try {
            String query = session.getUri().getQuery();
            if (query != null && query.contains("userId=")) {
                String[] params = query.split("&");
                for (String param : params) {
                    if (param.startsWith("userId=")) {
                        return param.substring(7);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error extracting userId: " + e.getMessage());
        }
        return null;
    }
}
