package com.banking.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Configuration to enable scheduled task execution
 * This enables all @Scheduled annotations in the application
 * TODO: Fix background jobs - currently disabled due to MongoDB migration
 */
@Configuration
// @EnableScheduling  // DISABLED: Fix jobs first
public class SchedulingConfiguration {
    // Configuration is handled by @EnableScheduling annotation
    // All @Scheduled methods in @Component or @Service classes will be executed
}
