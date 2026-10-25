"""Executes a notebook in place and exports it to HTML (the submission format).

Run from the repository root:  python3 scripts/run_notebook.py [path/to/notebook.ipynb]
(default: notebooks/Loan_Default_Prediction_Capstone.ipynb)
"""
import sys
import time
from pathlib import Path

import nbformat
from nbclient import NotebookClient
from nbconvert import HTMLExporter

ROOT = Path(__file__).resolve().parents[1]
NB_PATH = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / "notebooks" / "Loan_Default_Prediction_Capstone.ipynb"
HTML_PATH = NB_PATH.with_suffix(".html")

nb = nbformat.read(NB_PATH, as_version=4)
start = time.time()
client = NotebookClient(nb, timeout=1800, kernel_name="python3",
                        resources={"metadata": {"path": str(NB_PATH.parent)}})
client.execute()
nbformat.write(nb, NB_PATH)
print(f"Executed {len(nb.cells)} cells in {time.time() - start:.0f}s")

exporter = HTMLExporter()
exporter.exclude_input_prompt = False
body, _ = exporter.from_notebook_node(nb)
HTML_PATH.write_text(body, encoding="utf-8")
print(f"Wrote {HTML_PATH} ({HTML_PATH.stat().st_size / 1e6:.1f} MB)")

# Fail loudly if any cell produced an error output
errors = [(i, o) for i, c in enumerate(nb.cells) if c.cell_type == "code"
          for o in c.get("outputs", []) if o.get("output_type") == "error"]
if errors:
    for i, o in errors:
        print(f"ERROR in cell {i}: {o.get('ename')}: {o.get('evalue')}", file=sys.stderr)
    sys.exit(1)
