window.PROJECTS = [
  {
    repo: "auto-sci-harness",
    lead: "I built",
    rest: "a system where an AI agent can write the code and make the claim, but cannot sign the certificate.",
    standout: "Agents explore freely in a Lab, then a Court re-runs their frozen code on data held back from them, and ten mechanical checks decide whether the claim holds. No model can grant a pass.",
    detail: "Each Court version must first get 11 planted claims right, including leaks, p-hacking and sabotaged baselines. That exam caught a real hole in my own system, a strawman baseline certified as VALIDATED, and I closed it. An attack museum records 65 findings against the checker: 51 fixed, 13 accepted as stated limits, 1 open.",
    outcomeLabel: "Where it stands",
    outcome: "Experimental, not production-grade. It has been used locally for research runs, and the first certified result is the next milestone.",
    tags: ["research agents", "verification", "systems"],
    hue: 190
  },
  {
    repo: "stress-testing-weight-space-programming",
    lead: "I replicated",
    rest: "a headline claim about AI editing neural network weights, then found a far simpler rival.",
    standout: "Turning thinking off, with no edit, reached about 76% of the edit's gain at about one-seventh of the tokens. The edit still won, 61.0% to 48.8%.",
    detail: "I rebuilt the edit from its authors' published logs and ran it in 87 minutes on four rented RTX 5090s, alongside experiments on circuits, backdoors and sycophancy. Weights revealed sycophancy only with a known template (AUC 0.89 at 25% of labels), and a network stayed 100% accurate while single-unit swaps stopped giving the predicted answer.",
    outcomeLabel: "What it showed",
    outcome: "The scores replicate: 54.0% on MATH-500 against the paper's 48.1%, and 68.0% on GSM8K against 67.1%. Thinking off used different settings, so that comparison is not matched. The LLM experiments did not run, and this is exploratory, not peer reviewed.",
    tags: ["replication", "weight edits", "interpretability"],
    hue: 62
  },
  {
    repo: "flow-policy-noise-carry",
    lead: "I found",
    rest: "that a robot policy's best setting in clean simulation turns clearly worse under just 0.2 s of delay.",
    standout: "Across 1,600 paired episodes on SmolVLA and LIBERO, replanning every 10 steps gained 22.5 points on all 10 tasks when clean, then lost 14.0 with delay (p ≈ 0.002).",
    detail: "I built the noise-carry idea and tried to break it. It showed no improvement (+1.0), and a screen I declared in advance had pointed to that in under 20 minutes, a check others can reuse. I also derived hard limits on time-aligned carry and confirmed them in exact simulations.",
    outcomeLabel: "What it showed",
    outcome: "The delay reversal was not the planned test, so it is a strong lead to confirm on fresh tasks. This is one checkpoint in simulation and says nothing about real hardware.",
    tags: ["robotics", "flow matching", "benchmarking"],
    hue: 214
  },
  {
    repo: "how-networks-forget",
    lead: "I caught",
    rest: "a plain memory probe reporting memory that controlled tests could not find.",
    standout: "After 5 later tasks, the probe still read 0.49 retained while scoring 0.317 on the trained task and 0.321 on tasks the network never saw. Measured at 2 labelled images per class.",
    detail: "Six hypotheses on whether forgetting is overwriting or lost access, each committed before its data. The two main experiments took their verdicts from 20 fresh seeds per setting, with constants set blind on separate seeds.",
    outcomeLabel: "What it showed",
    outcome: "The gap was 0.41 [0.35, 0.47] on ResNet-18 and Split CIFAR-100. That raises a question about published probe readings without refuting them, and real memory does survive: stronger keys reached 0.39 and 0.54. The MNIST numbers replicated on fresh seeds. No biology-to-AI mapping was supported.",
    tags: ["forgetting", "memory", "preregistered"],
    hue: 172
  },
  {
    repo: "world-model-adaptation-vs-retention",
    lead: "I reproduced",
    rest: "and extended JEPA-TTT, passed its published AUC at a higher update rate, and designed a version that holds on to the old world on one shift.",
    standout: "On the paper's evaluation schedule, x16 updates passed its AUC on grid (0.755 vs 0.725) and wave (0.773 vs 0.728), on different checkpoints. On wave, my before-plus-now design reached 0.757 and scored 0.807 right after the world switched back, where x16 fell to 0.320.",
    detail: "I found no official code, so I implemented the method from the paper on the Two-Room task, using the public LeWorldModel checkpoint. I then added a switch-back test the paper does not report and five further ideas with pass or fail rules set in advance.",
    outcomeLabel: "What it showed",
    outcome: "On wave, adapting and remembering pull apart, and keeping the predictor frozen while learning a small action translator holds on to the old world (0.812 for the frozen model). At the paper's own update rate I scored below it, and before-plus-now adapts more slowly on grid (0.676). Its AUC is only roughly comparable and its pass is partly by construction. 3 seeds, one task.",
    tags: ["reproduction", "world models", "retention"],
    hue: 118
  },
  {
    repo: "physics",
    lead: "I asked",
    rest: "171 questions that climb from why glass doors push one way to what a falling notebook falls into.",
    standout: "They came from my everyday curiosity, with LLMs as an intellectual sparring partner. One line of questioning became a closed antimatter engine, and my own energy account correctly shows why it can't deliver net work.",
    detail: "The questions keep their original wording. They run through friction, entropy, relativity, black holes, time loops, Boltzmann brains and whether a thought can be made of atoms. Seven sections and 59 verification scripts back the answers.",
    outcomeLabel: "Where it stands",
    outcome: "Every answer carries a label for its support, from Derived and Code to Open and Speculative. Where no proof is possible, the answer says so. It has not been peer reviewed.",
    tags: ["physics", "black holes", "thought experiments"],
    hue: 140
  },
  {
    repo: "world-model-adaptation",
    lead: "I killed",
    rest: "9 of my own 14 hypotheses, including a world-model result that held from state and vanished from pixels.",
    standout: "Better prediction did not mean better control: on the pendulum from pixels, the method with the lowest prediction error had the lowest control success. The gaps to RLS were below my effect rule.",
    detail: "Latent tuning against closed-form weight writes on simulated pendulum, puck and drone, with 20 training seeds, 674 passing tests and 105 pixel comparisons recomputed from raw records with no disagreement.",
    outcomeLabel: "What it showed",
    outcome: "From state, each method won its own regime; from pixels, the latent won both. Pixels may bury the signal adaptation needs, which fits but does not prove the drone and puck failures. Pixel verdicts cover pendulum only, in small simulators.",
    tags: ["world models", "adaptation", "control"],
    hue: 322
  },
  {
    repo: "falsifiable-dl-math",
    lead: "I traced",
    rest: "a transformer's collapse past its training length from suspected bug to measured mechanism, and found a change that removes it in a toy run.",
    standout: "Loss jumps from 1.48 to about 5 bits per byte, and removing the far tokens from attention brings it back to 1.49. ALiBi stayed flat to 8x training length. Toy run, 2 seeds.",
    detail: "Eight hypotheses on the math of deep learning, with derivations, numeric checks and kill criteria set before the runs (one closed-form check is the exception), including exact identities for Adam's epsilon. My mistakes stay on the record.",
    outcomeLabel: "What it showed",
    outcome: "No new method of mine has beaten a tuned baseline so far. What I have is verified mathematics, clear negative results and a diagnosis. The full long-context run is still pending.",
    tags: ["attention", "optimizers", "long context"],
    hue: 38
  },
  {
    repo: "continual-learning-experiments",
    lead: "I ran",
    rest: "five linked projects on learning and memory, and found that forgetting here is mostly lost access.",
    standout: "Refitting only the last layer gave 70.6%, against 41.5% as trained and 73.5% for joint training, so most of the knowledge was still there. Toy scale.",
    detail: "The record spans continual learning, memory, world models and robot learning, failures included. A recurrent memory wall broke once the state got a reader (lock-in 10/10 against 1/10). A fresh re-implementation flipped two of my conclusions, and an outside audit caught another error.",
    outcomeLabel: "What it showed",
    outcome: "Most ideas tested lost, and the strongest results explain why. Everything is small: toys, Split-MNIST and Split CIFAR. Nothing has run on a robot.",
    tags: ["continual learning", "memory", "world models"],
    hue: 268
  },
  {
    repo: "transfer",
    lead: "I built",
    rest: "the first stage of a robot arm world model that keeps learning during deployment. Execution unfinished.",
    standout: "Baseline B1 is coded: LoRA and token-residual adapters, replay, a promotion gate with rollback, six-joint planning and a shadow-mode online loop, tested on CPU against the real predictor code.",
    detail: "A full mathematical and implementation specification for the SO-101 arm, with a source audit, and working code for its first baseline: a frozen RoboJEPA representation, a servo bridge and persistent adaptation of small layers.",
    outcomeLabel: "Where it stands",
    outcome: "Released weights, real data, GPUs and a real arm have not been run yet, so whether adaptation helps on real data is still open. The live robot driver and the recurrent belief are not built.",
    tags: ["robotics", "world models", "unfinished"],
    hue: 346
  },
  {
    repo: "llm-introspection-probes",
    lead: "I tested",
    rest: "whether a model naming an injected concept is introspection or something simpler.",
    standout: "The injected position still gained when the prompt never asked about injection, which looks more like salience capture than a report. On one small model.",
    detail: "Every design I retrieved asks about injection in the prompt, so I built one that asks something else, with competence gates, sham checks and random-direction controls. CI recomputes the results table and fails if the README disagrees. One experiment has data; two more are built and have not run.",
    outcomeLabel: "What it showed",
    outcome: "Logit lift was above zero in all six conditions. Capture verdict mixed, generic anomaly supported, control strength uninformative. The salience reading was not preregistered, and it is one model, not replicated at 4B or above.",
    tags: ["interpretability", "introspection", "preregistered"],
    hue: 96
  },
  {
    repo: "sleep",
    lead: "I tested",
    rest: "whether a small language model can consolidate new facts offline without destroying what it knows.",
    standout: "Anchoring on the model's own questions kept 26 points more real knowledge than replay plus KL while still learning new facts. 3 seeds, 2 nights, exploratory.",
    detail: "It began as a bet that a measured signal could control consolidation better than a schedule. That signal failed its tests, so I abandoned it and followed what the data showed.",
    outcomeLabel: "What it showed",
    outcome: "Composed facts told outright reached reworded questions. False recall on look-alike names is unsolved, nothing is confirmed yet, and a ten-night confirmatory run is planned, not done.",
    tags: ["consolidation", "language models", "preregistered"],
    hue: 12
  }
];
