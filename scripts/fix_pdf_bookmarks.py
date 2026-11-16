"""Give the PDF copy of the slide deck full bookmark titles.

LibreOffice cuts each bookmark of an exported deck at about 63 characters, so some slide titles end in the middle
of a word in the bookmark pane. This script reads the slide titles from the PowerPoint file and writes them into
the bookmarks of the PDF as "<slide number>. <title>". It changes nothing on the pages.

Run from the repository root, after the PDF conversion:
    python3 scripts/fix_pdf_bookmarks.py presentation/Loan_Default_Prediction_Presentation.pptx \
        presentation/Loan_Default_Prediction_Presentation.pdf
"""
import html
import re
import sys
import zipfile

from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, TextStringObject


def slide_titles(pptx_path):
    """The title of each slide, in slide order."""
    deck = zipfile.ZipFile(pptx_path)
    count = len([n for n in deck.namelist() if re.fullmatch(r"ppt/slides/slide\d+\.xml", n)])
    titles = []
    for number in range(1, count + 1):
        xml = deck.read(f"ppt/slides/slide{number}.xml").decode("utf-8")
        title = ""
        for shape in re.findall(r"<p:sp>.*?</p:sp>", xml, flags=re.S):
            if re.search(r'<p:ph[^>]*type="(?:title|ctrTitle)"', shape):
                title = " ".join(html.unescape(t) for t in re.findall(r"<a:t>(.*?)</a:t>", shape, flags=re.S))
                break
        titles.append(re.sub(r"\s+", " ", title).strip())
    return titles


def main(pptx_path, pdf_path):
    titles = slide_titles(pptx_path)
    reader = PdfReader(pdf_path)
    writer = PdfWriter(clone_from=reader)
    writer.pdf_header = reader.pdf_header  # keep the PDF version of the export
    outlines = writer._root_object.get("/Outlines")
    if outlines is None:
        sys.exit("The PDF has no bookmarks: nothing to do")
    items = []
    node = outlines.get_object().get("/First")
    while node is not None:
        node = node.get_object()
        items.append(node)
        node = node.get("/Next")
    if len(items) != len(titles) or len(titles) != len(writer.pages) or not all(titles):
        sys.exit(f"Bookmarks ({len(items)}), slide titles ({len(titles)}) and pages ({len(writer.pages)}) do not match: PDF not changed")
    for number, (item, title) in enumerate(zip(items, titles), start=1):
        item[NameObject("/Title")] = TextStringObject(f"{number}. {title}")
    with open(pdf_path, "wb") as out:
        writer.write(out)
    print(f"bookmarks: {len(items)} full slide titles written to {pdf_path}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
