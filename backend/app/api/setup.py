from fastapi import APIRouter, Request, Form, Depends, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from pathlib import Path

from app.database import get_db
from app.models.system import AdminUser

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@router.get("/setup", response_class=HTMLResponse)
async def setup_page(request: Request, db: Session = Depends(get_db)):
    """Serve the First-Run Setup Wizard."""
    # Check if setup is already done
    user_count = db.query(AdminUser).count()
    if user_count > 0:
        return RedirectResponse(url="/admin/login", status_code=303)
        
    return templates.TemplateResponse("setup.html", {"request": request})

@router.post("/setup")
async def setup_submit(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    confirm_password: str = Form(...),
    db: Session = Depends(get_db)
):
    """Handle Setup Form Submission."""
    # Security: Verify again
    if db.query(AdminUser).count() > 0:
         return RedirectResponse(url="/admin/login", status_code=303)

    if password != confirm_password:
        return templates.TemplateResponse("setup.html", {
            "request": request, 
            "error": "Passwords do not match"
        })
    
    # Create Admin
    hashed_pw = pwd_context.hash(password)
    new_admin = AdminUser(username=username, password_hash=hashed_pw)
    db.add(new_admin)
    db.commit()
    
    return RedirectResponse(url="/admin/login", status_code=303)
