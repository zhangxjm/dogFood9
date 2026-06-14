from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Nodule
from .serializers import NoduleSerializer, NoduleUpdateSerializer


class StudyNodulesView(generics.ListAPIView):
    serializer_class = NoduleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Nodule.objects.filter(study_id=self.kwargs['study_id'])


class NoduleListCreateView(generics.ListCreateAPIView):
    serializer_class = NoduleSerializer
    permission_classes = [IsAuthenticated]
    queryset = Nodule.objects.all()


class NoduleDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Nodule.objects.all()

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return NoduleUpdateSerializer
        return NoduleSerializer
