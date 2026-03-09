package tn.esprit.activities.api;

import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tn.esprit.activities.security.JwtService;

public abstract class BaseApiController {

    protected String requireUserId(JwtService jwtService, String authorizationHeader) {
        try {
            String token = jwtService.extractTokenFromAuthHeader(authorizationHeader);
            if (token == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
            }
            return jwtService.extractUserId(token);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
    }

    protected Claims requireClaims(JwtService jwtService, String authorizationHeader) {
        try {
            String token = jwtService.extractTokenFromAuthHeader(authorizationHeader);
            if (token == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
            }
            return jwtService.parseToken(token);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }
    }
}
