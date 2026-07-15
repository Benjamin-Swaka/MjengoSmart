# ============================================================
# MjengoSmart — User Serializers
# ============================================================

from django.contrib.auth.password_validation import validate_password
from rest_framework                          import serializers
from rest_framework_simplejwt.tokens         import RefreshToken

from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Read serializer for the current user profile."""

    class Meta:
        model  = User
        fields = [
            'id', 'username', 'email',
            'first_name', 'last_name',
            'role', 'phone', 'location_name',
            'latitude', 'longitude',
            'is_verified', 'date_joined',
        ]
        read_only_fields = ['id', 'date_joined', 'is_verified']


class RegisterSerializer(serializers.ModelSerializer):
    """Registration serializer with password confirmation."""

    password  = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'},
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        label='Confirm password',
        style={'input_type': 'password'},
    )

    class Meta:
        model  = User
        fields = [
            'username', 'email',
            'password', 'password2',
            'first_name', 'last_name',
            'role', 'phone', 'location_name',
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {'password': 'Passwords do not match.'}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')

        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class TokenResponseSerializer(serializers.Serializer):
    """Returns JWT tokens + user data after login/register."""

    access  = serializers.CharField()
    refresh = serializers.CharField()
    user    = UserSerializer()

    @staticmethod
    def get_tokens_for_user(user):
        refresh = RefreshToken.for_user(user)
        return {
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data,
        }