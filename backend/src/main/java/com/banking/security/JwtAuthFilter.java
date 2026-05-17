package com.banking.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired private JwtTokenProvider tokenProvider;
    @Autowired private CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        String requestPath = request.getRequestURI();

        try {
            if (header != null && header.startsWith("Bearer ")) {
                String token = header.substring(7);
                System.out.println("[JWT] Validating token for: " + requestPath);
                System.out.println("[JWT] Token (first 50 chars): " + token.substring(0, Math.min(50, token.length())));

                if (tokenProvider.validateToken(token)) {
                    String email = tokenProvider.getEmailFromToken(token);
                    System.out.println("[JWT] Token valid for user: " + email);

                    try {
                        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                        System.out.println("[JWT] User loaded: " + email + ", Authorities: " + userDetails.getAuthorities());

                        UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                        auth.setDetails(new WebAuthenticationDetailsSource()
                            .buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    } catch (Exception e) {
                        System.err.println("[JWT] Error loading user details for " + email + ": " + e.getMessage());
                        e.printStackTrace();
                    }
                } else {
                    System.err.println("[JWT] Token validation FAILED for: " + requestPath);
                }
            } else {
                System.out.println("[JWT] No Bearer token found in: " + requestPath);
            }
        } catch (Exception e) {
            System.err.println("[JWT] Filter exception: " + e.getMessage());
            e.printStackTrace();
        }

        filterChain.doFilter(request, response);
    }
}
