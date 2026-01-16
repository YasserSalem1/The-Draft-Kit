# Draft Model Training on Colab

1. **Upload** `draft_model_package.zip` to your Colab environment.
2. **Unzip** data:
   ```bash
   !unzip draft_model_package.zip
   ```
3. **Install Dependencies**:
   ```bash
   !pip install -r requirements.txt
   ```
4. **Run Training**:
   ```bash
   !python src/train.py
   ```

## Note on GPU
Make sure to select **Runtime > Change runtime type > GPU (T4)** in Colab for faster training. The script automatically detects CUDA.
