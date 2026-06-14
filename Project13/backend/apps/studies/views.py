import os
import pydicom
from django.http import FileResponse, JsonResponse
from django.conf import settings
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Study, StudyAnnotation
from .serializers import StudySerializer, StudyCreateSerializer, StudyAnnotationSerializer


class StudyListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StudyCreateSerializer
        return StudySerializer

    def get_queryset(self):
        queryset = Study.objects.all()
        patient_id = self.request.query_params.get('patient', '')
        status_filter = self.request.query_params.get('status', '')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class StudyDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudySerializer
    permission_classes = [IsAuthenticated]
    queryset = Study.objects.all()


class StudyUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        try:
            study = Study.objects.get(pk=pk)
        except Study.DoesNotExist:
            return Response({'detail': '检查不存在'}, status=status.HTTP_404_NOT_FOUND)

        file = request.FILES.get('file')
        if not file:
            return Response({'detail': '请上传文件'}, status=status.HTTP_400_BAD_REQUEST)

        study.dicom_file = file
        study.save()

        try:
            dcm = pydicom.dcmread(study.dicom_file.path)
            study.study_uid = str(dcm.get('StudyInstanceUID', study.study_uid))
            study.study_date = dcm.get('StudyDate', None)
            if study.study_date:
                date_str = str(study.study_date)
                if len(date_str) == 8:
                    from datetime import date
                    study.study_date = date(int(date_str[:4]), int(date_str[4:6]), int(date_str[6:8]))
            study.study_description = str(dcm.get('StudyDescription', study.study_description))
            study.modality = str(dcm.get('Modality', study.modality))
            study.save()
        except Exception:
            pass

        return Response(StudySerializer(study).data, status=status.HTTP_200_OK)


class StudyAnalyzeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            study = Study.objects.get(pk=pk)
        except Study.DoesNotExist:
            return Response({'detail': '检查不存在'}, status=status.HTTP_404_NOT_FOUND)

        study.status = 'analyzing'
        study.save()

        sync_mode = request.data.get('sync', False) if hasattr(request, 'data') else False

        if sync_mode:
            from apps.ml_engine.inference import InferenceEngine
            from apps.nodules.models import Nodule

            try:
                engine = InferenceEngine()
                result = engine.analyze_study(study)

                for nodule_data in result['nodules']:
                    confidence = nodule_data.pop('confidence', 0.0)
                    Nodule.objects.create(study=study, **nodule_data)

                study.status = 'completed'
                study.save()

                return Response({
                    'detail': '分析完成',
                    'study_id': study.id,
                    'nodule_count': len(result['nodules']),
                }, status=status.HTTP_200_OK)
            except Exception as e:
                study.status = 'pending'
                study.save()
                return Response({'detail': f'分析失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            try:
                from apps.ml_engine.inference import analyze_study_async
                analyze_study_async.delay(study.id)
            except Exception:
                from apps.ml_engine.inference import InferenceEngine
                from apps.nodules.models import Nodule

                try:
                    engine = InferenceEngine()
                    result = engine.analyze_study(study)

                    for nodule_data in result['nodules']:
                        confidence = nodule_data.pop('confidence', 0.0)
                        Nodule.objects.create(study=study, **nodule_data)

                    study.status = 'completed'
                    study.save()
                except Exception:
                    study.status = 'pending'
                    study.save()
                    return Response({'detail': '分析失败'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'detail': '已提交AI分析任务', 'study_id': study.id}, status=status.HTTP_200_OK)


class StudyDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            study = Study.objects.get(pk=pk)
        except Study.DoesNotExist:
            return Response({'detail': '检查不存在'}, status=status.HTTP_404_NOT_FOUND)

        if not study.dicom_file:
            return Response({'detail': '无DICOM文件'}, status=status.HTTP_404_NOT_FOUND)

        file_path = study.dicom_file.path
        if os.path.exists(file_path):
            return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=os.path.basename(file_path))
        return Response({'detail': '文件不存在'}, status=status.HTTP_404_NOT_FOUND)


class AnnotationListCreateView(generics.ListCreateAPIView):
    serializer_class = StudyAnnotationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return StudyAnnotation.objects.filter(study_id=self.kwargs.get('study_pk', self.kwargs.get('pk')))

    def perform_create(self, serializer):
        study_id = self.kwargs.get('study_pk', self.kwargs.get('pk'))
        serializer.save(annotator=self.request.user, study_id=study_id)


class AnnotationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudyAnnotationSerializer
    permission_classes = [IsAuthenticated]
    queryset = StudyAnnotation.objects.all()
