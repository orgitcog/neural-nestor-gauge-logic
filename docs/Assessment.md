# Assessment

**Date:** Wed 12/17/2025

<!-- TOC -->

- [My Recent Background and Motivation for Tensor Logic](#my-recent-background-and-motivation-for-tensor-logic)
- [What Happened with Cursor](#what-happened-with-cursor)
  - [What was Difficult](#what-was-difficult)
  - [What's Was Really Wrong](#whats-was-really-wrong)
  - [What's Good](#whats-good)
- [Looking Forward](#looking-forward)

<!-- /TOC -->

## My Recent Background and Motivation for Tensor Logic

Up 'til now I've taken a kind of hands-off policy toward ML so far as training goes. The software to do it has always seemed clunky and difficult (and a reason for my interest in Modular's Mojo programming language earlier this year.) I vowed to apply ML via LLMs for the purposes of applying generative AI to software development using Claude Code and Cursor, practical stuff like Perplexity.ai (especially morning brainstorms in Research and Lab mode) and fun stuff like creating song lyrics with ChatGPT and the actual sound track with www.udio.com (but now with www.sonic.com since Udio no longer allows downloads).
- The past three years since the great ChatGPT moment have been the technological thrill ride of the century of for me. And I ain't lookin' back with any regret.

So, I was strictly hands off for at least a year now about training LLMs and even quite shy of using ML algorithms for non-training purposes. But along comes Tensor Logic and being the sucker for yet another programming language (TypeScript and Rust being my favorite with Mojo being distant second), I could simply could not resist the oh-so sexy, just right abstraction level and conciseness of Tensor Logic to revisit all that I had pretty much come to ignore in ML. So, my motivation for learning Tensor Logic is to understand ML and raise my skill level.
- To a great extent, Mathematica serves this purpose (and is one of the suggestions in [Performance-Options.md](Performance-Options.md)). It has very sexy Machine Learning objects, but it is a closed system with a significant subscription cost with its really good chatbot costing extra. But I would not be above doing the software engineering work to compile a stand-alone application.  But mainly, the drawback to Mathematica is the huge size but for which its chatbot does help.

Indeed everything that Prof. Domingos has done in career in ML since the late 90's and his academic pedigree as Professor Emeritus along with the wonderful MLST interview tells me this a good and righteous things to do. His exposition of the Tribes of AI in his book, "The Master Algorithm" was real eye-opener for me. So having seen Tim Scarfe briefly demo Tensor with Claude Code, I was indeed inspired to do the same with Cursor (much better and way way more cost effective than Claude Code).

## What Happened with Cursor

So I started off "big" with Opus 4.5 in Cursor.  Clearly it got the gist of Domingos' paper about the einsum allowing unification.  However, due to cost constraints (I have a $20/mo subscription and didn't feel like upgrading to the $60/mo plan), I had to switch from Opus 4.5 to Auto mode in Cursor. 
- You can see this clearly in [Prompts.md](Prompts.md).

All told, I devote about 4 full days (Sunday thru Wednesday) to getting this development in Cursor done.
- I spent about 2/3 of the time to infrastructure development issues rather than content issues, however. You can clearly see that in [Prompts.md](Prompts.md) and in the git commit history. Take a look at [README_dev.md](../README_dev.md) and you'll get a very clear idea of what a butt-load of work it is to bring a web app online (without using Lovable or Replit).

It's important to clarify that this is a collection of **pre-computed examples**, not an interactive demo where users can run calculations themselves. The result is a static web page with a small Rust backend to satisfy the requirements of Shuttle.dev. It is not a dynamic one with a GPU-powered backend. This architecture makes performance considerations rather moot, since all computations are pre-worked. Nevertheless, a static page of pre-worked examples is a good start to minimize runtime cost and avoid the gnarly GPU programming
-  with all due respect to Modular's Mojo programming language, one of the suggestions in [Performance-Options.md](Performance-Options.md). For those interested in performance optimization for live calculations, I recommend reading [Performance-Options.md](Performance-Options.md), where the chatbot provided five good suggestions for boosting the performance of live calculations, including a surprise one, WebGPU, which puts the onus of GPU computation on the user's computer rather than requiring server-side GPU infrastructure.

### What was Difficult

It was difficult to get Cursor to adopt even the notation of Tensor Logic given in the paper. It started out with tidy little Tensor Logic Code boxes but somehow they devolved into an almost alien-like, ASCII notation. (It used regexp's and I think my switch to self-hosted fonts for alleged security issues may have unduly constrained it.) And I'm not really certain that it got it quite right, though it seems to have come close. I wound up deleting the Tensor Logic Code boxes. 😨

### What's Was Really Wrong

Most especially, instead of the formulas for examples in that paper, Opus used it's own knowledge of Tensors, einsums and general ML and created formulas for those examples  in its own way. This makes a simple comparison between the examples the the web app and what's in the paper exceedingly difficult for a novice in ML such as myself. I can't say that it's formulas are wrong, but I certainly can't tell straightforwardly if they're right with a simple comparison to Prof. Domingos' paper. 
- I couldn't help but notice how quickly the initial examples were generated. As noted in the main [README.md](../README.md) file, more work is needed to validate (or invalidate) the examples by comparing those computations with other established software implementation of the specific ML examples. Again, LLMs can be our friend here. But not now as I'm out of time. 🤨

### What's Good
The fold-out UI in each of the examples in the web app is nice because you can separately conceal or reveal each step of the computation separately. As a program, Tensor Logic allows for concise, elegant psuedo-code in the examples. The fold-out UI works quite smoothly showing you the details, once step at a time, if you use the Next and Previous navigation buttons provided in each of the examples.

## Looking Forward

I do believe that an MCP server for Tensor Logic or a compiler or interpreter for Tensor Logic with good Language Server Protocol (LSP) like the one for Rust would be very beneficial to generating examples for Tensor Logic using Cursor. 😮

So I do hope that Prof. Domingos and his cadre of students working on Tensor Logic gain some insight in how (and how not) to do examples of Tensor Logic as a web app. And that those jolly good guys, Tim and Keith, at Machine Learning Street Talk (MLST) keep up their good work and soon invite Prof. Domingos back again for yet another round of interview. ❤️

--Sam Kirk  
sam@samkirk.com  
https://www.linkedin.com/in/samuelkirk

