---
title: "Thoughts"
description: "생각과 비평"
---

# Thoughts

{{#each (sort (folder ".") "date" "desc") as |file|}}
{{#if (not (eq file.slug "_index"))}}
- [[{{file.slug}}]] ({{file.date}})
{{/if}}
{{/each}}
