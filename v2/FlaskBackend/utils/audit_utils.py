from .. import db
from ..models import AuditLog
from datetime import datetime
import logging

def create_audit_log(action, user_id, user_email, resource, resource_id=None, status='SUCCESS', details=None, ip_address=None, user_agent=None):
    log = AuditLog(
        action=action,
        user_id=user_id,
        user_email=user_email,
        resource=resource,
        resource_id=resource_id,
        status=status,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent,
        timestamp=datetime.utcnow()
    )
    db.session.add(log)
    db.session.commit()
    logging.info(f"AUDIT: {action} by {user_email} on {resource} ({resource_id}) status={status}")
