from rest_framework import serializers
from .models        import Review


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()

    class Meta:
        model  = Review
        fields = [
            'id', 'reviewer', 'reviewer_name',
            'target_type', 'target_id',
            'rating', 'comment', 'created_at',
        ]
        read_only_fields = ['id', 'reviewer', 'created_at']

    def get_reviewer_name(self, obj):
        return obj.reviewer.get_full_name() or obj.reviewer.username

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError(
                'Rating must be between 1 and 5.'
            )
        return value