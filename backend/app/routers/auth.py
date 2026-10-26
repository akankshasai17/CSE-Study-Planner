from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user
from app.models.models import User, UserProfile, NotificationPreference
from app.schemas.schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    AuthTokenResponse,
    UserResponse,
    UserProfileUpdateRequest,
    PasswordChangeRequest,
    NotificationPreferenceUpdateRequest,
    NotificationPreferenceSchema,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & Profile"])


@router.post("/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    normalized_email = payload.email.strip().lower()
    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    user = User(
        full_name=payload.full_name.strip(),
        email=normalized_email,
        hashed_password=get_password_hash(payload.password),
        is_active=True,
    )
    db.add(user)
    db.flush()

    profile = UserProfile(
        user_id=user.id,
        college_name=(payload.college_name or "").strip(),
        semester=payload.semester or 5,
        branch="Computer Science & Engineering",
    )
    notif = NotificationPreference(user_id=user.id)
    db.add(profile)
    db.add(notif)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return AuthTokenResponse(access_token=token, user=user)


@router.post("/login", response_model=AuthTokenResponse)
def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
    normalized_email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    # Ensure profile & notification_preferences exist
    if not user.profile:
        db.add(UserProfile(user_id=user.id))
        db.commit()
        db.refresh(user)
    if not user.notification_preferences:
        db.add(NotificationPreference(user_id=user.id))
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id)
    return AuthTokenResponse(access_token=token, user=user)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    payload: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name.strip()

    profile = current_user.profile
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        db.flush()

    update_data = payload.model_dump(exclude_unset=True, exclude={"full_name"})
    for field, val in update_data.items():
        if hasattr(profile, field) and val is not None:
            setattr(profile, field, val)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password")
def change_password(
    payload: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )
    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from your current password.",
        )

    current_user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully."}


@router.get("/notifications", response_model=NotificationPreferenceSchema)
def get_notification_preferences(current_user: User = Depends(get_current_user)):
    return current_user.notification_preferences


@router.put("/notifications", response_model=NotificationPreferenceSchema)
def update_notification_preferences(
    payload: NotificationPreferenceUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notif = current_user.notification_preferences
    if not notif:
        notif = NotificationPreference(user_id=current_user.id)
        db.add(notif)
        db.flush()

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if hasattr(notif, field) and val is not None:
            setattr(notif, field, val)

    db.commit()
    db.refresh(notif)
    return notif
