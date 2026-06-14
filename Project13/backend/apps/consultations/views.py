from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Consultation, ConsultationComment
from .serializers import ConsultationSerializer, ConsultationCreateSerializer, ConsultationCommentSerializer


class ConsultationListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ConsultationCreateSerializer
        return ConsultationSerializer

    def get_queryset(self):
        queryset = Consultation.objects.all()
        status_filter = self.request.query_params.get('status', '')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def perform_create(self, serializer):
        consultation = serializer.save(initiator=self.request.user)
        consultation.status = 'in_progress'
        consultation.save()


class ConsultationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ConsultationSerializer
    permission_classes = [IsAuthenticated]
    queryset = Consultation.objects.all()


class ConsultationRespondView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            consultation = Consultation.objects.get(pk=pk)
        except Consultation.DoesNotExist:
            return Response({'detail': '会诊不存在'}, status=status.HTTP_404_NOT_FOUND)

        content = request.data.get('content', '')
        attachments = request.data.get('attachments', [])

        comment = ConsultationComment.objects.create(
            consultation=consultation,
            author=request.user,
            content=content,
            attachments=attachments,
        )

        return Response(ConsultationCommentSerializer(comment).data, status=status.HTTP_201_CREATED)


class ConsultationCloseView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            consultation = Consultation.objects.get(pk=pk)
        except Consultation.DoesNotExist:
            return Response({'detail': '会诊不存在'}, status=status.HTTP_404_NOT_FOUND)

        result = request.data.get('result', '')
        consultation.status = 'completed'
        consultation.result = result
        consultation.save()

        return Response(ConsultationSerializer(consultation).data, status=status.HTTP_200_OK)


class ConsultationCommentsView(generics.ListAPIView):
    serializer_class = ConsultationCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ConsultationComment.objects.filter(consultation_id=self.kwargs['pk'])
