const auditController = require('../controllers/audit.controller');

/**
 * Audit middleware factory - creates middleware for specific action and entity type
 * @param {String} action - The action being performed (create, update, delete, view, etc.)
 * @param {String} entityType - The type of entity (user, department, task, etc.)
 * @param {Function} entityIdResolver - Function to extract entity ID from request (param, body, etc.)
 * @param {Function} detailsExtractor - Optional function to extract details from request to be logged
 */
exports.createAuditMiddleware = (action, entityType, entityIdResolver, detailsExtractor = () => ({})) => {
  return async (req, res, next) => {
    // Store original end method
    const originalEnd = res.end;
    
    // Override end method to capture response
    res.end = function(chunk, encoding) {
      // Restore original end method
      res.end = originalEnd;
      
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          // Extract entity ID using the provided resolver
          const entityId = entityIdResolver(req);
          
          // Extract additional details if provided
          const details = detailsExtractor(req, res);
          
          // Get user ID from authenticated request
          const userId = req.user._id;
          
          // Get IP address
          const ipAddress = req.ip || 
                          req.connection.remoteAddress || 
                          req.socket.remoteAddress || 
                          req.connection.socket.remoteAddress;
          
          // Log the action asynchronously (don't wait for it)
          auditController.createAuditLog(
            action, 
            entityType, 
            entityId, 
            userId, 
            details, 
            ipAddress
          ).catch(err => {
            console.error('Audit logging error:', err);
          });
        } catch (error) {
          console.error('Audit middleware error:', error);
        }
      }
      
      // Call the original end method
      return originalEnd.call(this, chunk, encoding);
    };
    
    // Continue to the next middleware
    next();
  };
};

/**
 * Auth event audit middleware - for login/logout events
 * @param {String} action - 'login' or 'logout'
 */
exports.authAudit = (action) => {
  return async (req, res, next) => {
    // Store original end method
    const originalEnd = res.end;
    
    // Override end method to capture response
    res.end = function(chunk, encoding) {
      // Restore original end method
      res.end = originalEnd;
      
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          // For login, user ID is in the response
          // For logout, user ID is already in req.user
          let userId;
          
          if (action === 'login') {
            // Try to extract user ID from response
            try {
              const body = JSON.parse(chunk.toString());
              userId = body.data && body.data.user ? body.data.user._id : null;
            } catch (e) {
              console.error('Error parsing response for login audit:', e);
            }
          } else if (action === 'logout') {
            userId = req.user._id;
          }
          
          if (userId) {
            // Get IP address
            const ipAddress = req.ip || 
                            req.connection.remoteAddress || 
                            req.socket.remoteAddress || 
                            req.connection.socket.remoteAddress;
            
            // Additional details
            const details = {
              userAgent: req.headers['user-agent'],
              timestamp: new Date().toISOString()
            };
            
            // Log the action asynchronously (don't wait for it)
            auditController.createAuditLog(
              action, 
              'system', 
              null, 
              userId, 
              details, 
              ipAddress
            ).catch(err => {
              console.error('Auth audit logging error:', err);
            });
          }
        } catch (error) {
          console.error('Auth audit middleware error:', error);
        }
      }
      
      // Call the original end method
      return originalEnd.call(this, chunk, encoding);
    };
    
    // Continue to the next middleware
    next();
  };
};

// Common entity ID resolvers
exports.entityIdResolvers = {
  // Get ID from request parameters
  fromParams: paramName => req => req.params[paramName],
  
  // Get ID from request body
  fromBody: fieldName => req => req.body[fieldName],
  
  // Get ID from authenticated user
  fromUser: () => req => req.user._id,
  
  // Get ID from response data
  fromResponse: fieldPath => (req, res) => {
    try {
      if (res.locals.responseData) {
        const pathParts = fieldPath.split('.');
        let value = res.locals.responseData;
        
        for (const part of pathParts) {
          value = value[part];
          if (value === undefined) return undefined;
        }
        
        return value;
      }
      return undefined;
    } catch (error) {
      console.error('Error extracting ID from response:', error);
      return undefined;
    }
  }
}; 