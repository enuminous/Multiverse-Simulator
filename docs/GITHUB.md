# Put the simulator on GitHub

Suggested repository: **`enuminous/EFMW-Multiverse-Simulator`**.
This name is a suggestion; the ZIP does not assume it already exists.

## Upload with GitHub's interface

1. Create a repository with your chosen name.
2. Extract `EFMW-Multiverse-Simulator.zip` locally.
3. Upload the **contents of the extracted project folder**, so `index.html`,
   `README.md`, `src/`, `assets/`, and the other folders are at the repository root.
   Uploading the ZIP itself does not deploy the app.
4. Commit the uploaded files to the default branch.

Some file pickers hide `.github/` and `.nojekyll`. Include them if you want the
workflows and the no-Jekyll marker; Git is the most reliable way to preserve the
whole directory. The simulator still runs without Actions.

## Simplest Pages setup — branch publishing

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Choose **main** (or your actual default branch), then **/(root)**, and save.
4. GitHub displays the live site URL when the deployment completes.

For the suggested repository name, the expected URL would be
`https://enuminous.github.io/EFMW-Multiverse-Simulator/`. It is an expected URL,
not a claim that a deployment has been made.

The app uses relative paths, so it works beneath a repository subpath as well as
at a domain root. No base-path configuration is needed.

## Alternative — included Actions deployment

1. Set **Settings → Pages → Source → GitHub Actions**.
2. Open **Actions → Deploy simulator to Pages → Run workflow** on the default branch.
3. The workflow checks the code, runs the test suite, builds `dist/`, uploads the
   Pages artifact, and deploys it to the `github-pages` environment.

The deployment workflow is manually triggered to coexist cleanly with the branch
publishing option. Run it again after updates, or add a `push` trigger if you
prefer automatic deployments. Any repository-specific environment approval rules
still apply.

The separate **Check simulator** workflow runs on pushes and pull requests. It
tests and builds; it does not publish a site.

## Upload with Git

Run these commands inside the extracted project directory, after creating the
empty repository. Substitute your repository URL if using a different name.

```bash
git init
git add .
git commit -m "Add EFMW multiverse simulator series"
git branch -M main
git remote add origin https://github.com/enuminous/EFMW-Multiverse-Simulator.git
git push -u origin main
```

GitHub authentication is handled by your existing Git credential setup. No token
is stored in this package.

## Static build

```bash
node scripts/check.js
node --test
node scripts/build.js
```

The resulting `dist/` is a standalone static site. The root project also runs
directly; the build simply copies the required files.

Official setup references, consulted October 11, 2026:

- [Configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Using custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
