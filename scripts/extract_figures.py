"""Saves selected charts from the executed notebook as PNG files for the report and slides.

Run from the repository root after scripts/run_notebook.py:  python3 scripts/extract_figures.py
"""
import base64
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NB = ROOT / "notebooks" / "Loan_Default_Prediction_Capstone.ipynb"
OUT = ROOT / "reports" / "figures"
OUT.mkdir(parents=True, exist_ok=True)

# (file name, substring that identifies the code cell, index of the image output within that cell)
WANTED = [
    ("missing_vs_present.png", "m = missing_vs_bad.melt", 0),
    ("default_rate_bands.png", "specs = [", 0),
    ("credit_history_counts.png", 'zip(axes, [("DEROG", 5), ("DELINQ", 6), ("NINQ", 8)])', 0),
    ("job_default.png", 'stacked_plot(data["JOB"]', 0),
    ("model_comparison.png", "plot_df = comparison", 0),
    ("roc_curves.png", "# ROC curves for the main candidates", 0),
    ("feature_importance.png", "importances = pd.Series(rf_tuned.feature_importances_", 0),
    ("threshold_tradeoff.png", "fig, ax1 = plt.subplots(figsize=(9, 4.8))", 0),
    ("final_confusion_matrix.png", "# Final model at the cost-minimising threshold", 0),
    ("decision_tree.png", "plot_tree(dt_tuned", 0),
    ("lr_coefficients.png", "coef = pd.DataFrame", 0),
]

nb = json.loads(NB.read_text())
for fname, key, img_idx in WANTED:
    for cell in nb["cells"]:
        if cell["cell_type"] != "code" or key not in "".join(cell["source"]):
            continue
        images = [o["data"]["image/png"] for o in cell.get("outputs", [])
                  if o.get("output_type") == "display_data" and "image/png" in o.get("data", {})]
        if len(images) <= img_idx:
            raise SystemExit(f"no image #{img_idx} in cell for {fname}")
        data = images[img_idx]
        data = "".join(data) if isinstance(data, list) else data
        (OUT / fname).write_bytes(base64.b64decode(data))
        print("saved", OUT / fname)
        break
    else:
        raise SystemExit(f"cell not found for {fname}: {key}")
