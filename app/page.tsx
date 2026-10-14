import Image from "next/image";
import ThreatExplorer from "./components/ThreatExplorer";

export default function HomePage() {
  return (
    <>
      <a className="skip-link" href="#article">Skip to article</a>
      <header className="masthead">
        <a className="wordmark" href="#top" aria-label="Back to the top"><span className="xt-mark">xT</span><span>Soccer research notes<small>THE GAME, IN PATTERNS</small></span></a>
        <div className="edition">NOTE 01 <span>/</span> MVP0</div>
      </header>
      <main id="top">
        <div className="hero">
          <p className="eyebrow">EXPECTED THREAT · TACTICAL CLUSTERING</p>
          <h1>The Shape<br />of Threat</h1>
          <p className="subtitle">Reading attacking patterns through xT</p>
          <p className="lede">How much danger a team creates is only part of the story.<br className="desktop-break" />The next question is where that danger begins.</p>
          <div className="article-meta"><span>Research &amp; writing · Liuhy</span><span>StatsBomb Open Data</span></div>
          <p className="audience-note">Prepared for the UIUC women's soccer coaching staff</p>
        </div>
      
        <div className="reading-layout">
          <aside className="contents" aria-label="Article contents">
            <p>IN THIS ARTICLE</p>
            <nav>
              <a href="#question"><span>01</span> The soccer question</a>
              <a href="#xt"><span>02</span> Valuing space</a>
              <a href="#example"><span>03</span> Valuing a pass</a>
              <a href="#matrix"><span>04</span> Building a team profile</a>
              <a href="#kmeans"><span>05</span> Finding similar patterns</a>
              <a href="#patterns"><span>06</span> Reading the groups</a>
              <a href="#channels"><span>07</span> Adding the destination</a>
              <a href="#reading"><span>08</span> From maps to match film</a>
            </nav>
            <div className="contents-note">Position value.<br />Action contribution.<br />Team attacking patterns.</div>
          </aside>
      
          <article id="article">
            <section id="question">
              <p className="section-no">01 / THE SOCCER QUESTION</p>
              <h2>Similar totals can tell different attacking stories.</h2>
              <p>Two teams can create a similar amount of danger while using the field very differently. One may make its most valuable passes from wide areas. Another may create more through the middle. A single total makes those differences difficult to see.</p>
              <p>My research asks a more specific question: <strong>which teams create a similar share of their attacking threat from similar areas of the field?</strong> The aim is to describe patterns a coach can recognize, discuss, and examine in match film.</p>
              <p>The approach starts with <strong>expected threat (xT)</strong>, turns individual actions into team maps, and uses <strong>k-means</strong> to group similar maps. The examples come from the project's existing collection of men's and women's competitions. Women's club examples receive particular attention below; these are historical research samples, not measurements of Illinois' own team.</p>
              <div className="story-path" aria-label="Research sequence: value positions, value actions, map teams, group similar profiles">
                <div><small>Position</small><strong>Value the space</strong></div><span aria-hidden="true">→</span>
                <div><small>Action</small><strong>Measure the change</strong></div><span aria-hidden="true">→</span>
                <div><small>Team</small><strong>Map the contribution</strong></div><span aria-hidden="true">→</span>
                <div><small>Pattern</small><strong>Find similar profiles</strong></div>
              </div>
            </section>
      
            <section id="xt">
              <p className="section-no">02 / A VALUE FOR EVERY ZONE</p>
              <h2>A pass can matter well before the shot.</h2>
              <p>A midfielder finds a teammate in space. That teammate can now carry forward or play into a dangerous area. The first pass has helped the attack, even though it did not immediately produce a shot.</p>
              <p>xT gives us a way to recognize that contribution. <strong>A location's xT represents its scoring potential within a simplified model of possession.</strong> It accounts for both shooting from that location and moving the ball to places from which the attack can develop. Karun Singh's <a href="https://karun.in/blog/expected-threat.html" target="_blank" rel="noreferrer">introduction to expected threat</a> explains the underlying idea.</p>
              <h3>How do we build the value map?</h3>
              <p>I divide the field into <strong>16 columns and 12 rows: 192 zones</strong>. Historical events describe what tends to happen when the ball is in each zone.</p>
              <ol className="explain-list">
                <li><strong>Count the choices.</strong> How often do players shoot or successfully move the ball? What share of the shots become goals?</li>
                <li><strong>Track the destinations.</strong> Where do completed passes and carries end? More frequent destinations receive more weight.</li>
                <li><strong>Connect the values.</strong> Begin with the contribution from shooting, then repeatedly bring in the value of the destinations a player can reach. This lets useful space farther from goal receive credit for what it enables next.</li>
              </ol>
              <div className="equation" aria-label="Zone xT equals the direct shooting contribution plus the contribution from moving to other zones">
                <div className="equation-main">Zone xT</div><span className="equals">=</span>
                <div><strong>Shooting contribution</strong><small>Share of shots × scoring rate from those shots</small></div><span className="equals">+</span>
                <div><strong>Moving contribution</strong><small>Share of moves × weighted value of their destinations</small></div>
              </div>
              <p>The research uses <strong>one shared xT map estimated from the pooled data</strong>. Every team's actions are valued against that same reference.</p>
              <ThreatExplorer />
              <details>
                <summary>View the original global xT value map</summary>
              <figure className="figure">
                <div className="figure-heading"><span>FIG. 01</span><strong>The shared location-value map</strong><a href="/assets/global-xt.png" target="_blank" rel="noreferrer">Full-size figure ↗</a></div>
                <Image src="/assets/global-xt.png" width="1600" height="960" alt="Global xT map with 16 columns and 12 rows. Teams attack to the right. The highest values are centrally near the right-hand goal, with local variation elsewhere." priority />
                <figcaption>Original notebook output. Attack runs left to right. Axes show zone indices; color shows <strong>the value of possessing the ball in a zone</strong>. Source: the project's global xT model.</figcaption>
              </figure>
              </details>
              <aside className="margin-note"><strong>A modelling assumption matters here.</strong> This implementation counts shots and successful passes and carries; unsuccessful moves are omitted. Its values belong to that simplified model and should not be read as observed scoring rates across all real possessions. Local values also need not rise steadily with proximity to goal.</aside>
            </section>
      
            <section id="example">
              <p className="section-no">03 / WHAT DID THE PASS ADD?</p>
              <h2>Value the change from start to finish.</h2>
              <p>For a completed pass or carry, the change in expected threat is:</p>
              <div className="delta-equation">Action ΔxT <span>=</span> End xT <span>−</span> Start xT</div>
              <p>Consider an illustrative sequence from A to B to C. <strong>The values below come from the saved xT grid; the sequence is an explanation, not a reconstruction of a match.</strong></p>
              <figure className="example-figure">
                <div className="example-points" aria-label="A has xT 0.1102; B has xT 0.2176; C has xT 0.2959. The first move adds 0.1073 and the second adds 0.0783.">
                  <div><span className="point-label">A</span><span>Beyond midfield</span><strong>0.1102</strong><small>Zone (8, 8)</small></div>
                  <div className="point-step"><span>Pass</span><strong>+0.1073</strong><span aria-hidden="true">→</span></div>
                  <div><span className="point-label">B</span><span>Closer to goal</span><strong>0.2176</strong><small>Zone (14, 6)</small></div>
                  <div className="point-step"><span>Pass</span><strong>+0.0783</strong><span aria-hidden="true">→</span></div>
                  <div><span className="point-label">C</span><span>In front of goal</span><strong>0.2959</strong><small>Zone (15, 6)</small></div>
                </div>
                <figcaption>Changes use the unrounded values; zone numbering starts at zero. Both actions increase location value. The earlier action adds more.</figcaption>
              </figure>
              <p>This is the useful shift in perspective: an earlier pass can receive substantial credit for improving the attack's position. Its value does not depend on whether a teammate eventually finishes the move.</p>
              <p>A pass to a lower-value zone can produce negative ΔxT. That does not automatically make it a poor decision: recycling possession may be exactly what the situation requires. The measure captures <strong>the change in location value</strong>, while a coach can assess the pressure, options, and purpose around it.</p>
            </section>
      
            <section id="matrix">
              <p className="section-no">04 / FROM ACTIONS TO A TEAM PROFILE</p>
              <h2>Where does a team create its threat?</h2>
              <p>The shared xT map values space. A team map answers a different question: <strong>from which areas does this team create positive changes in threat?</strong></p>
              <p>Each observation represents one team in one competition and season, or one tournament edition. A club's different seasons remain separate, so the profile belongs to a particular period.</p>
              <h3>Credit the starting zone.</h3>
              <p>For each successful pass or carry, I calculate ΔxT and retain its positive contribution. I then add those contributions in the zone where the action <strong>started</strong>. The pass filter excludes corners, free kicks, goal kicks, kickoffs, and throw-ins.</p>
              <div className="two-definitions">
                <div><span>LOCATION-VALUE MAP</span><h4>What is this space worth?</h4><p>One common reference for valuing every team's actions.</p></div>
                <div><span>TEAM CREATION MAP</span><h4>Where is value added?</h4><p>One distribution of positive contributions for each team-season.</p></div>
              </div>
              <h3>Express each zone as a share of the team's total.</h3>
              <p>Teams with more matches or more actions can accumulate larger totals. To focus on <strong>spatial pattern</strong>, I divide each zone's positive xT by the team's total positive xT. The resulting map adds up to 100%. If a zone accounts for one tenth of the total, its value in the team profile is 10%.</p>
              <p>The “raw” maps below are these share-based profiles before spatial smoothing. They show the distribution of positive creation; negative actions do not cancel positive contributions in this view.</p>
              <div className="sample-line"><strong>922</strong><span>initial profiles</span><span className="flow-arrow" aria-hidden="true">→</span><strong>288</strong><span>profiles grouped</span></div>
              <p className="small-copy">Included profiles have at least five matches, valid zone values, and a nonzero total. The sample spans different competitions, eras, and men's and women's soccer. The shared reference makes the measurement consistent; it does not remove those contextual differences.</p>
            </section>
      
            <section id="kmeans">
              <p className="section-no">05 / FINDING SIMILAR SHAPES</p>
              <h2>Why k-means fits this question.</h2>
              <p>Comparing two maps by eye is straightforward. Comparing hundreds consistently is harder. Here, every map has the same structure: <strong>192 numbers referring to the same 192 places on the field</strong>.</p>
              <p>Reading those numbers in a fixed order gives each team a numerical profile. Teams that create similar shares of threat in corresponding zones have similar profiles. That gives a grouping method something meaningful to compare. The inputs are the numbers behind the maps.</p>
              <h3>Unsupervised learning: finding groups without preset labels.</h3>
              <p><strong>Unsupervised learning</strong> looks for structure without being given a correct category for each example. I do not first label teams as a particular style. The method groups their spatial profiles; team names and competition information are used afterward to interpret the results.</p>
              <h3>K-means: describing a group through its center.</h3>
              <p>In <strong>k-means</strong>, <em>k</em> is the number of groups, and each group has an average center. The method assigns profiles to the nearest center and updates the centers from their members. This research's saved main result uses <strong>five groups</strong>: one useful level of detail for reading the sample, rather than a claim that soccer has five natural styles. <a className="reference-link" href="https://scikit-learn.org/stable/modules/clustering.html#k-means" target="_blank" rel="noreferrer">Method reference ↗</a></p>
              <p>Before grouping, I put the zone features on comparable scales and use PCA, a way to condense overlapping information while keeping the main differences. Similarity is measured in that prepared representation.</p>
              <div className="method-strip" aria-label="Grouping workflow: zone shares, information preparation, five groups, interpretation on the field">
                <div><b>01</b><strong>Describe</strong><span>192 zone shares per team</span></div>
                <div><b>02</b><strong>Prepare</strong><span>Comparable scales and condensed information</span></div>
                <div><b>03</b><strong>Group</strong><span>Profiles organized around five centers</span></div>
                <div><b>04</b><strong>Interpret</strong><span>Read the average maps on the field</span></div>
              </div>
              <p>To explain each group, I return to its members' <strong>original zone shares</strong>, average them, and draw them on the field again. These readable group maps summarize the members' patterns. The soccer interpretation comes from examining those patterns.</p>
            </section>
      
            <section id="patterns">
              <p className="section-no">06 / READING THE GROUPS</p>
              <h2>Start with what the maps have in common.</h2>
              <p>All five groups create much of their positive threat from advanced areas. The interesting differences lie within that shared picture: <strong>how far forward creation begins, how much it extends into deeper zones, and how strongly it involves central areas.</strong></p>
              <figure className="figure wide-figure">
                <div className="figure-heading"><span>FIG. 02</span><strong>Five average creation profiles</strong><a href="/assets/clusters-created.png" target="_blank" rel="noreferrer">Full-size figure ↗</a></div>
                <Image src="/assets/clusters-created.png" width="4393" height="2273" alt="Five average creation maps from Experiment A. Clusters 1 and 2 have similar advanced hotspots. Cluster 4 has a larger central share. Clusters 0 and 3 each contain one profile." />
                <figcaption>Original notebook output, Experiment A. Each cell is the group's <strong>mean share of positive xT created from that zone</strong>. All five panels share one color scale. Cluster numbers identify groups and do not rank them.</figcaption>
              </figure>
              <p>Three groups contain most of the sample. The individual field maps below redraw their saved averages on the same shared color scale.</p>
      
              <div className="cluster-story">
                <div className="cluster-map"><Image src="/assets/cluster-1.svg" width="720" height="510" alt="Cluster 1 mean creation map, with contributions concentrated in advanced zones." unoptimized /><span>CLUSTER 1 · 133 PROFILES</span></div>
                <div><p className="pattern-kicker">MORE ADVANCED STARTING POINTS</p><h3>Creation begins farther upfield.</h3><p><strong>72.8%</strong> of this group's creation falls in the five columns nearest the attacking goal, a larger share than in the other two large groups. The distinction is about where valuable actions begin.</p><p className="team-examples">Representative examples: Genoa, Toulouse, and Inter Milan · 2015/2016 men's seasons</p></div>
              </div>
              <div className="cluster-story">
                <div className="cluster-map"><Image src="/assets/cluster-2.svg" width="720" height="510" alt="Cluster 2 mean creation map, with a greater combined contribution from deeper zones than Cluster 1." unoptimized /><span>CLUSTER 2 · 65 PROFILES</span></div>
                <div><p className="pattern-kicker">A GREATER CONTRIBUTION FROM DEEPER AREAS</p><h3>Similar hotspots, with more depth.</h3><p>The advanced-zone share is <strong>68.4%</strong>. Compared with Cluster 1, more of the contribution comes from the middle and defensive portions of the field. This points to deeper starting locations; the map alone does not establish the speed or length of the moves.</p><p className="team-examples">Women's examples among the representatives: Aston Villa · 2023/2024, Women's Super League; Athletic Club · 2023/2024, Liga F</p></div>
              </div>
              <div className="cluster-story">
                <div className="cluster-map"><Image src="/assets/cluster-4.svg" width="720" height="510" alt="Cluster 4 mean creation map, with more of its contribution in the central four rows than Clusters 1 and 2." unoptimized /><span>CLUSTER 4 · 88 PROFILES</span></div>
                <div><p className="pattern-kicker">A LARGER CENTRAL CONTRIBUTION</p><h3>The middle of the field stands out.</h3><p>The central four rows account for <strong>38.9%</strong> of creation, compared with 32.7% and 32.4% in Clusters 1 and 2. “More central creation” therefore has a specific spatial meaning. Wide areas still contribute.</p><p className="team-examples">Representative examples: Juventus, Liverpool, and Real Madrid · 2015/2016 men's seasons</p></div>
              </div>
              <p className="small-copy">“Advanced zones” means length columns 11–15, the five columns nearest the attacking goal. “Central” means width rows 4–7. Representatives are profiles close to their group's center, not a ranking of team performance. A mixed group should not be read as a women's-only tactical category.</p>
      
              <h3>Two individual profiles remain separate.</h3>
              <p>Cluster 0 contains only <strong>Yeovil Town LFC, 2018/2019</strong>. Cluster 3 contains only <strong>Argentina men, 2024 Copa America</strong>. Both remain in the overview, but one distinctive team profile is not enough to establish a general tactical category.</p>
              <aside className="margin-note"><strong>A pattern to discuss:</strong> Is the difference mainly where positive contributions begin, or how they are spread across the width of the field? Those are questions these maps can make concrete. The sequence of passes, player roles, and opponent pressure still need match context.</aside>
              <p>I also explored spatial smoothing, which blends neighboring cells. The saved smoothed version produced the same grouping as the raw version, so the original grid is used here to keep the location differences visible.</p>
            </section>
      
            <section id="channels">
              <p className="section-no">07 / WHERE THE THREAT ARRIVES</p>
              <h2>Add the destination to the picture.</h2>
              <p>Two teams may create threat from similar starting zones but move the ball to different places. To capture that difference, I also credit each action's positive ΔxT to its <strong>ending zone</strong>.</p>
              <p>Each team now has two maps: <strong>where threat is created</strong> and <strong>where it is received</strong>. Each becomes its own share-based distribution, and the two are combined before grouping. “Received” includes both completed-pass destinations and carry endpoints.</p>
              <figure className="figure wide-figure">
                <div className="figure-heading"><span>FIG. 03</span><strong>Creation and reception together</strong><a href="/assets/clusters-multichannel.png" target="_blank" rel="noreferrer">Full-size figure ↗</a></div>
                <Image src="/assets/clusters-multichannel.png" width="4624" height="1605" alt="Five groups from the two-map analysis. Creation maps appear in the upper row, reception maps below. Reception hotspots tend to be closer to the right-hand goal." />
                <figcaption>Original notebook output, Experiment C. Top: creation. Bottom: reception. Panels within each row share a scale; the two rows are scaled separately. Compare color intensity <strong>within a row</strong>.</figcaption>
              </figure>
              <p>Adding destinations changes which profiles sit together. The table shows the full result and distinguishes creating from an advanced zone from delivering a valuable action into one.</p>
              <div className="table-wrap">
                <table>
                  <caption>Two-map grouping · mean shares in the five most advanced columns</caption>
                  <thead><tr><th scope="col">Group</th><th scope="col">Profiles</th><th scope="col">Creation share</th><th scope="col">Reception share</th></tr></thead>
                  <tbody>
                    <tr><th scope="row">Cluster 0</th><td>1</td><td>63.7%</td><td>81.1%</td></tr>
                    <tr><th scope="row">Cluster 1</th><td>95</td><td>74.6%</td><td>87.0%</td></tr>
                    <tr><th scope="row">Cluster 2</th><td>88</td><td>67.0%</td><td>82.7%</td></tr>
                    <tr><th scope="row">Cluster 3</th><td>41</td><td>69.9%</td><td>84.1%</td></tr>
                    <tr><th scope="row">Cluster 4</th><td>63</td><td>71.7%</td><td>83.7%</td></tr>
                  </tbody>
                </table>
              </div>
              <h3>A closer look at the women's club examples.</h3>
              <p>Representatives near the center of <strong>two-map Cluster 1</strong> include Juventus Women, Real Madrid Women, and Manchester City Women, all from 2023/2024. For the whole group, 74.6% of creation and 87.0% of reception fall in advanced zones. These are group averages, not individual figures for those clubs.</p>
              <p><strong>Two-map Cluster 3</strong> includes Aston Villa Women (2023/2024), San Diego Wave (2023), and Brighton &amp; Hove Albion Women (2023/2024) among its representatives. Its group averages are 69.9% for advanced creation and 84.1% for advanced reception. Relative to Cluster 1, positive contributions start and finish somewhat farther from goal in aggregate.</p>
              <p>These examples make the grouping easier to connect to women's soccer while retaining the actual mixed-sample research. They do not establish that every team within either group attacks in the same way.</p>
              <p><strong>Numbers do not carry across experiments:</strong> Cluster 1 here is not automatically the same group as Cluster 1 in the earlier analysis. Also, separate start and end maps do not reveal specific passing routes. Connecting two hotspots requires evidence from the actions themselves.</p>
            </section>
      
            <section id="reading">
              <p className="section-no">08 / FROM MAPS TO MATCH FILM</p>
              <h2>Give the tactical discussion a specific starting point.</h2>
              <p>The research turns “these teams look similar” into a statement that can be examined: <strong>these team-seasons create similar proportions of positive threat from similar locations.</strong></p>
              <p>A useful reading sequence is to identify the hotspots, compare their shares on the same scale, and then examine the actions behind them in match film. This keeps the conversation grounded in field position and attacking behavior.</p>
              <p>The maps leave some information out. Shares set overall volume aside. Zone totals do not preserve the order of actions. Positive contributions from successful moves do not capture every cost of possession. Competition, era, opposition, and data coverage also shape the result. The groups are therefore an exploratory description of attacking space.</p>
              <blockquote>Value the space.<br />Map the contribution.<br />Look for the pattern in the game.</blockquote>
              <p className="closing-note">This first version presents the saved research figures as static maps. A later version can let readers select zones, compare team profiles, and switch between creation and reception while following the same story.</p>
            </section>
      
            <footer className="article-footer">
              <h2>Data and reading</h2>
              <div className="source-brand"><Image src="/assets/statsbomb.png" width="5885" height="943" alt="StatsBomb data attribution logo" /><p>Event data: <a href="https://github.com/statsbomb/open-data" target="_blank" rel="noreferrer">StatsBomb Open Data</a>. The article uses the project's local historical dataset and saved outputs. Coverage reflects the available sample.</p></div>
              <ol className="source-list">
                <li><a href="https://karun.in/blog/expected-threat.html" target="_blank" rel="noreferrer">Karun Singh · Introducing Expected Threat (xT)</a><span>Conceptual reference for xT and inspiration for an illustrated explanation. This article's narrative, example, and clustering research are independently organized.</span></li>
                <li><a href="https://scikit-learn.org/stable/modules/clustering.html#k-means" target="_blank" rel="noreferrer">scikit-learn · K-means</a><span>Reference for unsupervised grouping and the k-means method.</span></li>
                <li><strong>Project research notebooks</strong><span>06: global xT and team-season matrices. 07A: raw distributions. 07B: smoothed distributions. 07C: combined creation and reception profiles. Figures and numerical examples come from the saved research outputs.</span></li>
              </ol>
              <div className="endmark"><span>xT / Soccer research notes</span><a href="#top">Back to top ↑</a></div>
            </footer>
          </article>
        </div>
      </main>
    </>
  );
}
