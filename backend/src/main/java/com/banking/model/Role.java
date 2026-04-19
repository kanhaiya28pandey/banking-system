package com.banking.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {
    @Id
    private String id;

    private String name;

    private String description;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum RoleType {
        ADMIN(1),
        MANAGER(2),
        EMPLOYEE(3),
        USER(4);

        private final int id;
        RoleType(int id) { this.id = id; }
        public int getId() { return id; }
    }
}
