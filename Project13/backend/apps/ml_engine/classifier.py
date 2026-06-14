import functools
import numpy as np

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False


MALIGNANCY_LEVEL_MAP = {
    (0, 20): 'benign',
    (20, 40): 'likely_benign',
    (40, 60): 'uncertain',
    (60, 80): 'likely_malignant',
    (80, 101): 'malignant',
}

NODULE_TYPE_MAP = {
    0: 'solid',
    1: 'part_solid',
    2: 'ground_glass',
}

MARGIN_MAP = {
    0: 'smooth',
    1: 'irregular',
    2: 'spiculated',
}


class NoduleClassifier:
    INPUT_SHAPE = (64, 64, 1)

    @functools.lru_cache(maxsize=1)
    def _get_model(self):
        inputs = keras.Input(shape=self.INPUT_SHAPE)

        x = layers.Conv2D(32, 3, padding='same', activation='relu')(inputs)
        x = layers.BatchNormalization()(x)
        x = layers.MaxPooling2D(2)(x)

        x = layers.Conv2D(64, 3, padding='same', activation='relu')(x)
        x = layers.BatchNormalization()(x)
        x = layers.MaxPooling2D(2)(x)

        x = layers.Conv2D(128, 3, padding='same', activation='relu')(x)
        x = layers.BatchNormalization()(x)
        x = layers.MaxPooling2D(2)(x)

        x = layers.Conv2D(256, 3, padding='same', activation='relu')(x)
        x = layers.BatchNormalization()(x)
        x = layers.GlobalAveragePooling2D()(x)

        feature_layer = layers.Dense(128, activation='relu', name='feature_dense')(x)

        malignancy_output = layers.Dense(1, activation='sigmoid', name='malignancy')(feature_layer)
        type_output = layers.Dense(3, activation='softmax', name='nodule_type')(feature_layer)
        margin_output = layers.Dense(3, activation='softmax', name='margin')(feature_layer)

        model = keras.Model(
            inputs=inputs,
            outputs=[malignancy_output, type_output, margin_output, feature_layer],
        )
        model.compile(
            optimizer='adam',
            loss={
                'malignancy': 'binary_crossentropy',
                'nodule_type': 'categorical_crossentropy',
                'margin': 'categorical_crossentropy',
            },
        )
        return model

    def classify(self, nodule_patch):
        if not TF_AVAILABLE:
            return self._demo_classify(nodule_patch)

        if len(nodule_patch.shape) == 2:
            nodule_patch = np.expand_dims(nodule_patch, axis=-1)
        if len(nodule_patch.shape) == 3:
            nodule_patch = np.expand_dims(nodule_patch, axis=0)

        resized = tf.image.resize(nodule_patch, (self.INPUT_SHAPE[0], self.INPUT_SHAPE[1]))
        normalized = resized / 255.0

        model = self._get_model()
        malignancy_pred, type_pred, margin_pred, features = model.predict(normalized, verbose=0)

        malignancy_score = int(malignancy_pred[0, 0] * 100)
        malignancy_level = self._score_to_level(malignancy_score)
        nodule_type = NODULE_TYPE_MAP.get(int(np.argmax(type_pred[0])), 'solid')
        margin = MARGIN_MAP.get(int(np.argmax(margin_pred[0])), 'smooth')

        return {
            'malignancy_score': malignancy_score,
            'malignancy_level': malignancy_level,
            'nodule_type': nodule_type,
            'margin': margin,
            'density': float(np.mean(nodule_patch)),
            'features': {
                'raw_features': features[0].tolist()[:10],
                'texture': float(np.std(nodule_patch)),
                'symmetry': float(1.0 - abs(np.mean(nodule_patch[:, :nodule_patch.shape[1]//2]) -
                                            np.mean(nodule_patch[:, nodule_patch.shape[1]//2:])) / 255.0),
            },
        }

    def _demo_classify(self, nodule_patch):
        malignancy_score = int(np.random.randint(0, 101))
        malignancy_level = self._score_to_level(malignancy_score)
        nodule_type = NODULE_TYPE_MAP.get(np.random.randint(0, 3), 'solid')
        margin = MARGIN_MAP.get(np.random.randint(0, 3), 'smooth')

        return {
            'malignancy_score': malignancy_score,
            'malignancy_level': malignancy_level,
            'nodule_type': nodule_type,
            'margin': margin,
            'density': float(np.random.uniform(0.1, 0.9)),
            'features': {
                'texture': float(np.random.uniform(0.1, 0.8)),
                'symmetry': float(np.random.uniform(0.5, 1.0)),
            },
        }

    def _score_to_level(self, score):
        for (low, high), level in MALIGNANCY_LEVEL_MAP.items():
            if low <= score < high:
                return level
        return 'malignant'
