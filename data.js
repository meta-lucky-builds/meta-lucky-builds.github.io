window.PROJECTS = [
  {
    repo: "falsifiable-dl-math",
    lead: "I built",
    rest: "a proving ground where deep-learning math has to earn its place.",
    detail: "I ran pre-registered toy experiments testing math changes to deep learning, such as attention normalizers and Adam's epsilon.",
    outcomeLabel: "What it showed",
    outcome: "RoPE's long-context collapse is not a bug and follows the training length, ALiBi held flat, and no new method has beaten a tuned baseline. Toy run, 2 seeds.",
    tags: ["deep learning", "attention", "optimizers"],
    hue: 38
  },
  {
    repo: "how-networks-forget",
    lead: "I ran",
    rest: "six preregistered experiments asking if forgotten tasks are overwritten or just misfiled.",
    detail: "I tested whether forgotten tasks are overwritten or merely hard to access across six preregistered experiments, plus biology-inspired ideas.",
    outcomeLabel: "What it showed",
    outcome: "A plain probe overstated retained memory on CIFAR (gap 0.41, measured at 2 labelled images per class), and forgetting split differently by setting. No biology-to-AI mapping was supported.",
    tags: ["forgetting", "memory", "preregistered"],
    hue: 172
  },
  {
    repo: "world-model-adaptation",
    lead: "I let",
    rest: "a simulated pendulum, puck and drone grade world-model adaptation.",
    detail: "I ran pre-registered tests of latent and closed-form weight-write test-time adaptation for small world models on simulated pendulum, puck and drone, from state and pixels.",
    outcomeLabel: "What it showed",
    outcome: "From state, each method won its own regime; from pixels (pendulum only, as drone and puck pixel runs failed their gates) the crossover did not survive. Lowest prediction error did not give best control.",
    tags: ["world models", "adaptation", "control"],
    hue: 322
  },
  {
    repo: "llm-introspection-probes",
    lead: "I built",
    rest: "a harness that plants concepts in a model and watches for flinches.",
    detail: "I preregistered a mechanistic-interpretability harness testing injected-concept introspection; only experiment E1 has run, on Qwen3-1.7B.",
    outcomeLabel: "What it showed",
    outcome: "Logit lift was above zero in all six conditions; capture verdict mixed, generic anomaly supported, control strength uninformative. One small model, not replicated at 4B or above.",
    tags: ["interpretability", "introspection", "llm"],
    hue: 96
  },
  {
    repo: "flow-policy-noise-carry",
    lead: "I tested",
    rest: "whether a robot policy improves by keeping its dice between replans.",
    detail: "I tested whether carrying sampling noise between replans improves a flow-matching robot policy (SmolVLA on LIBERO), in paired simulation episodes.",
    outcomeLabel: "What it showed",
    outcome: "No improvement shown for noise carry (+1.0 points). Replanning every 10 steps gained 22.5 points clean but lost 14.0 with 0.2 s delay.",
    tags: ["robotics", "flow matching", "simulation"],
    hue: 214
  },
  {
    repo: "sleep",
    lead: "I designed",
    rest: "a bedtime for small language models; none has been tucked in yet.",
    detail: "I wrote a preregistered design and unit-tested code for a study of overnight fact consolidation in small language models.",
    outcomeLabel: "Where it stands",
    outcome: "No experiment has been run and no results exist; only unit tests on tiny random models.",
    tags: ["consolidation", "language models", "study design"],
    hue: 12
  },
  {
    repo: "physics",
    lead: "I answered",
    rest: "171 physics questions and made each one show its working.",
    detail: "I answered 171 physics questions with proofs, derivations or code tests, grouped into seven sections.",
    outcomeLabel: "Where it stands",
    outcome: "There is no single overall result, and it is not peer reviewed.",
    tags: ["physics", "derivations", "proofs"],
    hue: 140
  },
  {
    repo: "continual-learning-experiments",
    lead: "I ran",
    rest: "small continual-learning tests and kept the failures in ink.",
    detail: "I ran small tests of continual learning and memory on toy tasks, Split-MNIST and Split CIFAR, and recorded the code and the failed attempts.",
    outcomeLabel: "What it showed",
    outcome: "On the toy, forgetting is mostly lost access rather than lost knowledge: a last-layer refit gave 70.6% against 41.5% as trained. Most tested ideas lost, and this holds only at small scale.",
    tags: ["continual learning", "memory", "split-mnist"],
    hue: 268
  },
  {
    repo: "stress-testing-weight-space-programming",
    lead: "I rebuilt",
    rest: "a published weight edit from logs and raced it against simpler rivals.",
    detail: "I rebuilt a published weight edit from its logs and tested it against simple alternatives, plus related experiments on circuits, backdoors and sycophancy.",
    outcomeLabel: "What it showed",
    outcome: "The edit replicates (54.0% on MATH-500 vs the paper's 48.1%), but simply turning thinking off reached 48.8% across both benchmarks, against 61.0% for the edit. The LLM arms of some ideas did not run; exploratory, not peer reviewed.",
    tags: ["replication", "weight edits", "llm"],
    hue: 62
  },
  {
    repo: "auto-sci-harness",
    lead: "I built",
    rest: "a courthouse for machine-made research claims; its docket is still empty.",
    detail: "I built a research-automation harness with a checker (Evidence Kernel), Docker-sandboxed agent labs and a claim-audit court.",
    outcomeLabel: "Where it stands",
    outcome: "Code tested, no real-agent run yet, and zero Court-certified discoveries so far.",
    tags: ["automation", "agents", "claim audit"],
    hue: 190
  },
  {
    repo: "transfer",
    lead: "I wrote",
    rest: "a robot arm's world model on paper; no robot has read it yet.",
    detail: "I wrote a specification and numerical checks for a robot-arm world model that adapts during deployment.",
    outcomeLabel: "Where it stands",
    outcome: "It is a spec, not trained or robot-tested. The checks cover math invariants, not robot performance.",
    tags: ["robotics", "world models", "specification"],
    hue: 346
  },
  {
    repo: "world-model-adaptation-vs-retention",
    lead: "I reproduced",
    rest: "JEPA-TTT in two rooms, then checked what adapting costs in memory.",
    detail: "I independently reproduced and extended JEPA-TTT on the Two-Room task using the public LeWorldModel checkpoint.",
    outcomeLabel: "What it showed",
    outcome: "It adapts, and more updates helped most (x16 AUC 0.773 on grid, 0.767 on wave); on wave, fine-tuning forgot the old world while the action-translator arm barely did. 3 seeds, one task.",
    tags: ["reproduction", "world models", "retention"],
    hue: 118
  }
];
