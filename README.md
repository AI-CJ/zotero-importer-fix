# Importing CSL JSON software citations

The CSL JSON file detector rejects a bibliography containing a software citation. A single such record also prevents detection of a mixed book and software bibliography. The minimal input is in [fixtures/software.json](fixtures/software.json).

Zotero's [schema](https://github.com/zotero/zotero-schema/blob/b86c79b56479cadac3288e1f122cf34ef04e8809/schema.json) already maps `software` to `computerProgram`. The [pinned translator](https://github.com/zotero/translators/blob/14ab2b615f70c3d6bbfae4e84e6f50d88c640e6a/CSL%20JSON.js) checks a separate list of types before calling the converter. The patch adds the missing entry and an embedded import test.

## Reproduce

With Git, Bash, Node.js 22+ and npm installed, run these commands separately. Each fetches the pinned translator, utilities and schema into a temporary directory.

```sh
bash verify.sh --baseline
bash verify.sh
```

On the baseline, three software detection checks fail. After the patch all nine checks pass, including the existing book import fixture. The Node test supplies a file reader and item completion hook and uses Zotero's own field converter. It covers detection and imported metadata. Desktop menus, clipboard integration and live identifier services are outside its scope.

To test automatic translator selection through Zotero's translation server, run
`bash verify.sh --server`. Its own HTTP import suite posts each embedded fixture,
checks the selected translator ID, and compares the returned item metadata.
With the original detector the software request returns 500 and the book request
succeeds. With the patch both return 200. This check runs locally without a Zotero account.

The patch is prepared for upstream review. No pull request has been submitted. The separate arXiv lead overlaps [an open metadata issue](https://github.com/zotero/translators/issues/3565); this patch affects CSL JSON only.

The translator carries Simon Kornblith and Sebastian Karcher's copyright. The patch and reproduction are available under [AGPL-3.0-or-later](LICENSE).
