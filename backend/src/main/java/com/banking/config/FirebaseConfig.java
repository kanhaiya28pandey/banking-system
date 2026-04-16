package com.banking.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.config.path}")
    private String firebaseConfigPath;

    /**
     * Initialize Firebase Admin SDK for Cloud Messaging (Push Notifications)
     * MongoDB is used for data storage, so we don't need Firebase Realtime Database
     */
    @PostConstruct
    public void initialize() {
        try {
            if (FirebaseApp.getApps().isEmpty()) {
                FileInputStream serviceAccount = new FileInputStream(firebaseConfigPath);

                FirebaseOptions options = new FirebaseOptions.Builder()
                        .setCredentials(GoogleCredentials.fromStream(serviceAccount))
                        .build();

                FirebaseApp.initializeApp(options);
                System.out.println("✓ Firebase initialized successfully for Cloud Messaging (Push Notifications)");
            }
        } catch (IOException e) {
            System.err.println("Firebase initialization failed: " + e.getMessage());
            System.err.println("Make sure firebase-config.json exists at: " + firebaseConfigPath);
            System.err.println("Get it from: Firebase Console > Project Settings > Service Accounts > Generate New Private Key");
        }
    }
}
