const fs = require("fs").promises;

function simulateFibaGame(team1, team2) {
  const quarters = 4;
  const rankingDifference = team1.FIBARanking - team2.FIBARanking;

  let team1BaseScorePerQuarter = 18 + Math.random() * 5;
  let team2BaseScorePerQuarter = 18 + Math.random() * 5;

  if (rankingDifference < 0) {
    team1BaseScorePerQuarter +=
      Math.abs(rankingDifference) *
      calculateRankingBoostPercentage(rankingDifference);
  } else {
    team2BaseScorePerQuarter +=
      rankingDifference * calculateRankingBoostPercentage(rankingDifference);
  }

  let team1Score = 0;
  let team2Score = 0;
  let overtime = false;

  // 4 quarters
  for (let i = 0; i < quarters; i++) {
    let team1QuarterScore = team1BaseScorePerQuarter + Math.random() * 2 - 1;
    let team2QuarterScore = team2BaseScorePerQuarter + Math.random() * 2 - 1;

    team1QuarterScore = Math.round(team1QuarterScore);
    team2QuarterScore = Math.round(team2QuarterScore);

    team1Score += team1QuarterScore;
    team2Score += team2QuarterScore;
  }

  //Overtime if needed
  while (team1Score === team2Score) {
    let team1OvertimeScore = team1BaseScorePerQuarter + Math.random() * 2 - 1;
    let team2OvertimeScore = team2BaseScorePerQuarter + Math.random() * 2 - 1;

    team1OvertimeScore = Math.round(team1OvertimeScore);
    team2OvertimeScore = Math.round(team2OvertimeScore);

    team1Score += team1OvertimeScore;
    team2Score += team2OvertimeScore;
    overtime = true;
  }

  const winner = team1Score > team2Score ? team1 : team2;
  const looser = team1Score > team2Score ? team2 : team1;

  return {
    team1: {
      name: team1.Team,
      score: team1Score,
      FIBARanking: team1.FIBARanking,
    },
    team2: {
      name: team2.Team,
      score: team2Score,
      FIBARanking: team2.FIBARanking,
    },
    overtime: overtime,
    winner: winner,
    looser: looser,
  };
}

function calculateRankingBoostPercentage(rankingDifference) {
  let rankingBoostPercentage = 0;
  if (Math.abs(rankingDifference) <= 2) rankingBoostPercentage = 0.1;
  if (Math.abs(rankingDifference) > 2 && Math.abs(rankingDifference) <= 5)
    rankingBoostPercentage = 0.2;
  if (Math.abs(rankingDifference) > 5 && Math.abs(rankingDifference) <= 10)
    rankingBoostPercentage = 0.3;
  if (Math.abs(rankingDifference) > 10) rankingBoostPercentage = 0.5;

  return rankingBoostPercentage;
}

function simulateGroupGames(group) {
  const standings = {};

  group.forEach((team) => {
    standings[team.Team] = {
      points: 0,
      pointDifference: 0,
      pointsScored: 0,
      headToHead: {},
      FIBARanking: team.FIBARanking,
    };
  });

  const results = [];
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const result = simulateFibaGame(group[i], group[j]);
      results.push(result);

      const team1 = standings[result.team1.name];
      const team2 = standings[result.team2.name];

      if (result.team1.score > result.team2.score) {
        team1.points += 2;
        team2.points += 1;
      } else {
        team2.points += 2;
        team1.points += 1;
      }

      team1.pointDifference += result.team1.score - result.team2.score;
      team2.pointDifference += result.team2.score - result.team1.score;

      team1.pointsScored += result.team1.score;
      team2.pointsScored += result.team2.score;

      team1.headToHead[result.team2.name] =
        result.team1.score - result.team2.score;
      team2.headToHead[result.team1.name] =
        result.team2.score - result.team1.score;
    }
  }

  results.forEach((result) => {
    if (!result.overtime) {
      console.log(
        `Final Score: ${result.team1.name} ${result.team1.score} - ${result.team2.score} ${result.team2.name}`
      );
    } else {
      console.log(
        `Final Score after OT: ${result.team1.name} ${result.team1.score} - ${result.team2.score} ${result.team2.name}`
      );
    }
    console.log(`Winner: ${result.winner.Team} \n\n`);
  });

  return calculateStandings(group, standings);
}

function calculateStandings(group, standings) {
  const sortedTeams = group
    .map((team) => team.Team)
    .sort((a, b) => {
      if (standings[b].points !== standings[a].points) {
        return standings[b].points - standings[a].points;
      }
      if (Object.keys(standings[a].headToHead).length === 1) {
        return standings[a].headToHead[b];
      }
      return standings[b].pointDifference - standings[a].pointDifference;
    });

  console.log(`Final Group Standings: `);
  sortedTeams.forEach((teamName, index) => {
    const team = standings[teamName];
    console.log(
      `${index + 1}. ${teamName} - Points: ${team.points}, Point Difference: ${
        team.pointDifference > 0
          ? `+${team.pointDifference}`
          : team.pointDifference
      }`
    );
  });

  return sortedTeams.map((teamName) => ({
    ...standings[teamName],
    Team: teamName,
    FIBARanking: standings[teamName].FIBARanking,
  }));
}

function rankTeams(standings) {
  const rankedTeams = { first: [], second: [], third: [] };

  for (const groupName in standings) {
    const groupStandings = standings[groupName];
    rankedTeams.first.push(groupStandings[0]);
    rankedTeams.second.push(groupStandings[1]);
    rankedTeams.third.push(groupStandings[2]);
  }

  ["first", "second", "third"].forEach((rank) => {
    rankedTeams[rank].sort(
      (a, b) =>
        b.points - a.points ||
        b.pointDifference - a.pointDifference ||
        b.pointsScored - a.pointsScored
    );
  });

  return rankedTeams;
}

function createHats(rankedTeams) {
  return {
    hatD: [rankedTeams.first[0], rankedTeams.first[1]],
    hatE: [rankedTeams.first[2], rankedTeams.second[0]],
    hatF: [rankedTeams.second[1], rankedTeams.second[2]],
    hatG: [rankedTeams.third[0], rankedTeams.third[1]],
  };
}

function displayHats(hats) {
  console.log("Hats:");
  for (const hat in hats) {
    console.log(`    ${hat}`);
    hats[hat].forEach((team) => console.log(`        ${team.Team}`));
  }
}

function generateEliminationPhase(hats, standings) {
  const quarterFinals = [];

  quarterFinals.push(...pairTeams(hats.hatD, hats.hatG, standings));
  quarterFinals.push(...pairTeams(hats.hatE, hats.hatF, standings));

  const updatedQuarterFinals = quarterFinals.map((match) => {
    const team1Ranking = getTeamRanking(match.team1.Team, standings);
    const team2Ranking = getTeamRanking(match.team2.Team, standings);

    return {
      team1: {
        ...match.team1,
        FIBARanking: team1Ranking,
      },
      team2: {
        ...match.team2,
        FIBARanking: team2Ranking,
      },
    };
  });

  const semiFinals = generateSemiFinals(updatedQuarterFinals);

  return { quarterFinals: updatedQuarterFinals, semiFinals };
}

function getTeamRanking(teamName, standings) {
  for (const groupName in standings) {
    const group = standings[groupName];
    const team = group.find((t) => t.Team === teamName);
    if (team) {
      return team.FIBARanking;
    }
  }
  return null;
}

function pairTeams(hat1, hat2, standings) {
  const pairs = [];
  hat1.forEach((team1) => {
    let pairFound = false;
    let attempts = 0;
    while (!pairFound && attempts < 10) {
      const randomIndex = Math.floor(Math.random() * hat2.length);
      const team2 = hat2[randomIndex];

      if (!havePlayedBefore(team1, team2, standings)) {
        pairs.push({ team1, team2 });
        hat2.splice(randomIndex, 1);
        pairFound = true;
      }
      attempts++;
    }
    if (!pairFound && hat2.length > 0) {
      // If no pair found after 10 attempts, pair with the first available team
      const team2 = hat2.shift();
      pairs.push({ team1, team2 });
    }
  });
  return pairs;
}

function havePlayedBefore(team1, team2, standings) {
  for (const groupName in standings) {
    const group = standings[groupName];
    if (
      group.find((team) => team.Team === team1.Team) &&
      group.find((team) => team.Team === team2.Team)
    ) {
      return true;
    }
  }
  return false;
}

function generateSemiFinals(quarterFinals) {
  const semiFinals = [];

  semiFinals.push({
    team1: quarterFinals[0].team1,
    team2: quarterFinals[3].team1,
  });

  semiFinals.push({
    team1: quarterFinals[1].team1,
    team2: quarterFinals[2].team1,
  });

  return semiFinals;
}

function displayEliminationPhase(eliminationPhase) {
  console.log(" \nElimination Phase:");

  eliminationPhase.quarterFinals.forEach((match, index) => {
    console.log(
      `Quarter-Final ${index + 1}: ${match.team1.Team} vs ${match.team2.Team}`
    );
  });

  console.log("Semi-Final 1: Winner of QF1 vs Winner of QF4");
  console.log("Semi-Final 2: Winner of QF2 vs Winner of QF3");
  console.log("Bronze medal match: Looser of SF1 vs Looser of SF2");
  console.log("Gold medal match: Winner of SF1 vs Winner of SF2");
}

function simulateEliminationPhase(eliminationPhase) {
  // Simulate Quarter-Finals
  console.log("Quarter-Finals:");
  const quarterFinalResults = eliminationPhase.quarterFinals.map(
    (match, index) => {
      const result = simulateFibaGame(match.team1, match.team2);
      console.log(
        `Quarter-Final ${index + 1}: ${result.team1.name} ${
          result.team1.score
        } - ${result.team2.score} ${result.team2.name}`
      );
      console.log(`Winner: ${result.winner.Team} \n`);
      return result;
    }
  );

  // Determine Semi-Final Matchups
  const semiFinals = [
    {
      team1: quarterFinalResults[0].winner,
      team2: quarterFinalResults[3].winner,
    },
    {
      team1: quarterFinalResults[1].winner,
      team2: quarterFinalResults[2].winner,
    },
  ];

  // Simulate Semi-Finals
  console.log("Semi-Finals:");
  const semiFinalResults = semiFinals.map((match, index) => {
    const result = simulateFibaGame(match.team1, match.team2);
    console.log(
      `Semi-Final ${index + 1}: ${result.team1.name} ${result.team1.score} - ${
        result.team2.score
      } ${result.team2.name}`
    );
    console.log(`Winner: ${result.winner.Team} \n`);
    return result;
  });

  // Bronze Medal Match (3rd Place)
  console.log("Bronze Medal Match:");
  const bronzeMatch = {
    team1: semiFinalResults[0].looser,
    team2: semiFinalResults[1].looser,
  };
  const bronzeResult = simulateFibaGame(bronzeMatch.team1, bronzeMatch.team2);
  console.log(
    `Bronze Medal Match: ${bronzeResult.team1.name} ${bronzeResult.team1.score} - ${bronzeResult.team2.score} ${bronzeResult.team2.name}`
  );
  console.log(`Winner (Bronze): ${bronzeResult.winner.Team} \n`);

  // Final (Gold Medal Match)
  console.log("Final:");
  const finalMatch = {
    team1: semiFinalResults[0].winner,
    team2: semiFinalResults[1].winner,
  };
  const finalMatchResult = simulateFibaGame(finalMatch.team1, finalMatch.team2);
  console.log(
    `Final: ${finalMatchResult.team1.name} ${finalMatchResult.team1.score} - ${finalMatchResult.team2.score} ${finalMatchResult.team2.name}`
  );
  console.log(`Winner (Gold): ${finalMatchResult.winner.Team} \n`);

  return {
    quarterFinals: quarterFinalResults,
    semiFinals: semiFinalResults,
    bronzeMatch: bronzeResult,
    finalMatch: finalMatchResult,
  };
}

fs.readFile("groups.json", "utf8")
  .then((data) => {
    const groups = JSON.parse(data);
    const standings = {};
    for (const groupName in groups) {
      console.log(`Simulating games for group ${groupName}:`);
      standings[groupName] = simulateGroupGames(groups[groupName]);
      console.log("--------------------------------");
    }
    const rankedTeams = rankTeams(standings);

    const { hatD, hatE, hatF, hatG } = createHats(rankedTeams);
    displayHats({ hatD, hatE, hatF, hatG });

    const eliminationPhase = generateEliminationPhase(
      { hatD, hatE, hatF, hatG },
      standings
    );
    displayEliminationPhase(eliminationPhase);

    console.log("--------------------------------");
    console.log("Simulating elimination phase...");
    simulateEliminationPhase(eliminationPhase);
  })
  .catch((error) => console.error("Error loading groups.json:", error));
