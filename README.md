A tool to get publications list from DBLP as a table in LaTeX or in BibTeX for references.

![](https://i.imgur.com/VaudKyG.jpg)

> Don't reveal this to your professor. Say you are doing clerical work.

<br>


```bash
$ node index.js latex-table https://dblp.org/pid/XX/YYYY.html -o output.tex
# Generated LaTeX table saved to output.tex

$ node index.js bibtex https://dblp.org/pid/XX/YYYY.html -o output.bib
# Generated BibTeX file saved to output.bib

$ node index.js latex-table https://dblp.org/pid/XX/YYYY.html -o output.tex --title /dynamic/i
# Filter publications by title containing "dynamic" (case-insensitive), and save to output.tex

$ node index.js latex-table https://dblp.org/pid/XX/YYYY.html -o output.tex --year 1999-2009
# Filter publications by year between 1999 and 2009, and save to output.tex

$ node index.js latex-table https://dblp.org/pid/XX/YYYY.html -o output.tex --author /Teja/i
# Filter publications by author containing "Teja" (case-insensitive), and save to output.tex

$ node index.js bibtex https://dblp.org/pid/XX/YYYY.html -o output.bib --author /Teja/i
# Filter publications by author containing "Teja" (case-insensitive), and save to output.bib
```

<br>
<br>


## References

- [dblp: How can I fetch all publications of one specific author?](https://dblp.org/faq/How+can+I+fetch+all+publications+of+one+specific+author.html)
- [JavaScript Reference : MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference)
- [Regex lookahead, lookbehind and atomic groups](https://stackoverflow.com/q/2973436/1413259)
- [BibTeX](https://en.wikipedia.org/wiki/BibTeX)

<br>
<br>


[![](https://img.youtube.com/vi/yqO7wVBTuLw/maxresdefault.jpg)](https://www.youtube.com/watch?v=yqO7wVBTuLw)<br>
[![ORG](https://img.shields.io/badge/org-javascriptf-green?logo=Org)](https://javascriptf.github.io)
