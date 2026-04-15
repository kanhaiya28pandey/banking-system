package com.banking.service;

import com.banking.websocket.BalanceUpdateHandler;
import com.banking.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class WebSocketBalanceService {

    @Autowired private BalanceUpdateHandler balanceUpdateHandler;
    @Autowired private AccountRepository accountRepository;

    public void broadcastBalanceUpdate(String userId, String accountNumber) {
        try {
            accountRepository.findByAccountNumber(accountNumber).ifPresent(account -> {
                Map<String, Object> update = new HashMap<>();
                update.put("type", "BALANCE_UPDATE");
                update.put("accountNumber", accountNumber);
                update.put("balance", account.getBalance());
                update.put("timestamp", LocalDateTime.now().toString());

                balanceUpdateHandler.broadcastBalance(userId, update);
            });
        } catch (Exception e) {
            System.err.println("Error broadcasting balance update: " + e.getMessage());
        }
    }
}
