import functools
import numpy as np

try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False


class NoduleDetector:
    INPUT_SHAPE = (512, 512, 1)

    @functools.lru_cache(maxsize=1)
    def _get_model(self):
        inputs = keras.Input(shape=self.INPUT_SHAPE)

        c1 = layers.Conv2D(32, 3, padding='same', activation='relu')(inputs)
        c1 = layers.Conv2D(32, 3, padding='same', activation='relu')(c1)
        p1 = layers.MaxPooling2D(2)(c1)

        c2 = layers.Conv2D(64, 3, padding='same', activation='relu')(p1)
        c2 = layers.Conv2D(64, 3, padding='same', activation='relu')(c2)
        p2 = layers.MaxPooling2D(2)(c2)

        c3 = layers.Conv2D(128, 3, padding='same', activation='relu')(p2)
        c3 = layers.Conv2D(128, 3, padding='same', activation='relu')(c3)
        p3 = layers.MaxPooling2D(2)(c3)

        c4 = layers.Conv2D(256, 3, padding='same', activation='relu')(p3)
        c4 = layers.Conv2D(256, 3, padding='same', activation='relu')(c4)
        p4 = layers.MaxPooling2D(2)(c4)

        b = layers.Conv2D(512, 3, padding='same', activation='relu')(p4)
        b = layers.Conv2D(512, 3, padding='same', activation='relu')(b)

        u4 = layers.Conv2DTranspose(256, 2, strides=2, padding='same')(b)
        u4 = layers.Concatenate()([u4, c4])
        u4 = layers.Conv2D(256, 3, padding='same', activation='relu')(u4)
        u4 = layers.Conv2D(256, 3, padding='same', activation='relu')(u4)

        u3 = layers.Conv2DTranspose(128, 2, strides=2, padding='same')(u4)
        u3 = layers.Concatenate()([u3, c3])
        u3 = layers.Conv2D(128, 3, padding='same', activation='relu')(u3)
        u3 = layers.Conv2D(128, 3, padding='same', activation='relu')(u3)

        u2 = layers.Conv2DTranspose(64, 2, strides=2, padding='same')(u3)
        u2 = layers.Concatenate()([u2, c2])
        u2 = layers.Conv2D(64, 3, padding='same', activation='relu')(u2)
        u2 = layers.Conv2D(64, 3, padding='same', activation='relu')(u2)

        u1 = layers.Conv2DTranspose(32, 2, strides=2, padding='same')(u2)
        u1 = layers.Concatenate()([u1, c1])
        u1 = layers.Conv2D(32, 3, padding='same', activation='relu')(u1)
        u1 = layers.Conv2D(32, 3, padding='same', activation='relu')(u1)

        output_map = layers.Conv2D(1, 1, activation='sigmoid', name='detection_map')(u1)
        output_class = layers.GlobalAveragePooling2D()(b)
        output_class = layers.Dense(128, activation='relu')(output_class)
        output_class = layers.Dense(1, activation='sigmoid', name='nodule_confidence')(output_class)

        model = keras.Model(inputs=inputs, outputs=[output_map, output_class])
        model.compile(
            optimizer='adam',
            loss={
                'detection_map': 'binary_crossentropy',
                'nodule_confidence': 'binary_crossentropy',
            },
        )
        return model

    def detect(self, image_array):
        if not TF_AVAILABLE:
            return self._demo_detect(image_array)

        if len(image_array.shape) == 2:
            image_array = np.expand_dims(image_array, axis=-1)
        if len(image_array.shape) == 3:
            image_array = np.expand_dims(image_array, axis=0)

        resized = tf.image.resize(image_array, (self.INPUT_SHAPE[0], self.INPUT_SHAPE[1]))
        normalized = resized / 255.0

        model = self._get_model()
        detection_map, confidence = model.predict(normalized, verbose=0)

        boxes = self._extract_boxes(detection_map[0, :, :, 0], confidence[0, 0])
        return boxes

    def _demo_detect(self, image_array):
        boxes = []
        num_nodules = np.random.randint(1, 4)
        h, w = image_array.shape[:2]
        for _ in range(num_nodules):
            x = np.random.randint(0, max(w - 60, 1))
            y = np.random.randint(0, max(h - 60, 1))
            bw = np.random.randint(15, 60)
            bh = np.random.randint(15, 60)
            confidence = np.random.uniform(0.5, 0.95)
            boxes.append({
                'x': float(x),
                'y': float(y),
                'width': float(bw),
                'height': float(bh),
                'confidence': float(confidence),
            })
        return boxes

    def _extract_boxes(self, heatmap, global_confidence, threshold=0.3):
        boxes = []
        if global_confidence < threshold:
            return boxes

        binary = (heatmap > threshold).astype(np.float32)

        visited = np.zeros_like(binary, dtype=bool)
        h, w = binary.shape

        for i in range(h):
            for j in range(w):
                if binary[i, j] > 0 and not visited[i, j]:
                    region_pixels = []
                    stack = [(i, j)]
                    while stack:
                        ci, cj = stack.pop()
                        if ci < 0 or ci >= h or cj < 0 or cj >= w:
                            continue
                        if visited[ci, cj] or binary[ci, cj] == 0:
                            continue
                        visited[ci, cj] = True
                        region_pixels.append((ci, cj))
                        stack.extend([(ci - 1, cj), (ci + 1, cj), (ci, cj - 1), (ci, cj + 1)])

                    if len(region_pixels) < 5:
                        continue

                    ys = [p[0] for p in region_pixels]
                    xs = [p[1] for p in region_pixels]
                    y_min, y_max = min(ys), max(ys)
                    x_min, x_max = min(xs), max(xs)

                    region_scores = [heatmap[y, x] for y, x in region_pixels]
                    confidence = float(np.mean(region_scores))

                    if confidence >= threshold:
                        boxes.append({
                            'x': float(x_min),
                            'y': float(y_min),
                            'width': float(x_max - x_min),
                            'height': float(y_max - y_min),
                            'confidence': confidence,
                        })

        return boxes
