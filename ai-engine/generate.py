import argparse
import pandas as pd
import json
import sys
import os
import logging
from sdv.single_table import CTGANSynthesizer

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def load_anomalies(anomaly_json):
    if not anomaly_json:
        return None
    try:
        return json.loads(anomaly_json)
    except Exception as e:
        logger.warning(f"Failed to parse anomaly JSON: {e}")
        return None

def apply_anomalies(df, anomalies):
    if not anomalies:
        return df
    
    logger.info(f"Applying anomalies to {len(anomalies)} columns...")
    for anomaly in anomalies:
        col = anomaly.get('column')
        type = anomaly.get('type')
        value = anomaly.get('value')
        ratio = anomaly.get('ratio', 0.05)

        if col in df.columns:
            count = int(len(df) * ratio)
            indices = df.sample(n=count).index
            if type == 'fixed':
                df.loc[indices, col] = value
            elif type == 'null':
                df.loc[indices, col] = None
                
    return df

def generate(model_path, count, output_path, original_path=None, anomaly_json=None):
    logger.info(f"Loading model from {model_path}...")
    try:
        model = CTGANSynthesizer.load(model_path)
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        sys.exit(1)

    original_df = None
    if original_path and os.path.exists(original_path):
        logger.info(f"Loading original data for leakage protection from {original_path}")
        original_df = pd.read_csv(original_path)

    generated_data = pd.DataFrame()
    
    logger.info(f"Generating {count} privacy-safe synthetic records...")
    
    attempts = 0
    max_attempts = 10
    
    while len(generated_data) < count and attempts < max_attempts:
        attempts += 1
        needed = count - len(generated_data)
        # Generate slightly more than needed to account for potential filtering
        batch_size = int(needed * 1.1) + 10
        logger.info(f"Generation Pass {attempts}/{max_attempts}: Generating {batch_size} records...")
        
        try:
            samples = model.sample(num_rows=batch_size)
        except Exception as e:
            logger.error(f"Sampling failed: {e}")
            break

        # Apply Anomalies (Inject before leakage check to ensure injected values don't leak)
        anomalies = load_anomalies(anomaly_json)
        if anomalies:
            samples = apply_anomalies(samples, anomalies)

        # Leakage Protection & Privacy Filter
        if original_df is not None and not original_df.empty:
            cols = list(original_df.columns)
            # Ensure columns match
            common_cols = [c for c in cols if c in samples.columns]
            
            if len(common_cols) > 0:
                samples_to_check = samples[common_cols]
                merged = samples_to_check.merge(original_df, on=common_cols, how='left', indicator=True)
                leaked_indices = merged[merged['_merge'] == 'both'].index
                
                if len(leaked_indices) > 0:
                    logger.warning(f"  - Detected {len(leaked_indices)} leaked records (Projected Strictness: High). Removing...")
                    samples = samples.drop(leaked_indices)
                else:
                    logger.info("  - No leakage detected.")
        
        generated_data = pd.concat([generated_data, samples], ignore_index=True)
        # Remove internal duplicates if any
        generated_data = generated_data.drop_duplicates()
        
    # Trim to exact count
    if len(generated_data) > count:
        generated_data = generated_data.head(count)
    
    logger.info(f"Final Dataset: {len(generated_data)} records generated.")
    if len(generated_data) < count:
        logger.warning(f"Could not generate full {count} unique records after {max_attempts} attempts.")
        
    samples = generated_data

    logger.info(f"Saving synthetic data to {output_path}...")
    try:
        samples.to_csv(output_path, index=False)
        logger.info("Generation complete.")
    except Exception as e:
        logger.error(f"Failed to save output: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Generate Synthetic Data')
    parser.add_argument('--model', required=True, help='Path to trained model (.pkl)')
    parser.add_argument('--count', type=int, default=1000, help='Number of records to generate')
    parser.add_argument('--output', required=True, help='Path to save synthetic CSV')
    parser.add_argument('--original', help='Path to original CSV for leakage protection')
    parser.add_argument('--anomalies', help='JSON string for anomaly injection')

    args = parser.parse_args()
    generate(args.model, args.count, args.output, args.original, args.anomalies)
