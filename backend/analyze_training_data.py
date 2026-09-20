import numpy as np
import pandas as pd

from app import app
from models.training_data import TrainingData


def analyze_training_data():

    print("\n" + "=" * 70)
    print("SMART PROCUREMENT - TRAINING DATA ANALYSIS")
    print("=" * 70)

    with app.app_context():

        # ------------------------------------------------------
        # LOAD DATA FROM DATABASE
        # ------------------------------------------------------

        records = TrainingData.query.all()

        print(f"\nTotal database records: {len(records)}")

        if not records:
            print("No training data found.")
            return

        data = []

        for record in records:
            data.append({
                "district": str(record.district).strip(),
                "crop": str(record.crop).strip(),
                "season": str(record.season).strip(),
                "year": record.year,
                "area": record.area,
                "production": record.production
            })

        df = pd.DataFrame(data)

        # ------------------------------------------------------
        # CONVERT NUMERIC COLUMNS
        # ------------------------------------------------------

        for column in ["year", "area", "production"]:
            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

        print("\nInitial shape:", df.shape)

        # ------------------------------------------------------
        # MISSING VALUES
        # ------------------------------------------------------

        print("\n" + "=" * 70)
        print("1. MISSING VALUES")
        print("=" * 70)

        print(df.isnull().sum())

        # ------------------------------------------------------
        # INVALID VALUES
        # ------------------------------------------------------

        print("\n" + "=" * 70)
        print("2. INVALID VALUES")
        print("=" * 70)

        print("Area <= 0:",
              int((df["area"] <= 0).sum()))

        print("Production < 0:",
              int((df["production"] < 0).sum()))

        # ------------------------------------------------------
        # DUPLICATES
        # ------------------------------------------------------

        print("\n" + "=" * 70)
        print("3. DUPLICATE RECORDS")
        print("=" * 70)

        duplicate_count = df.duplicated().sum()

        print("Exact duplicates:",
              int(duplicate_count))

        print(
            "Duplicate percentage:",
            round(
                (duplicate_count / len(df)) * 100,
                2
            ),
            "%"
        )

        # ------------------------------------------------------
        # CLEAN FOR ANALYSIS
        # ------------------------------------------------------

        df = df.dropna(
            subset=[
                "district",
                "crop",
                "season",
                "year",
                "area",
                "production"
            ]
        )

        df = df[
            (df["area"] > 0)
            &
            (df["production"] >= 0)
        ].copy()

        df = df.drop_duplicates()

        print("\nRecords after cleaning:",
              len(df))

        # ------------------------------------------------------
        # BASIC STATISTICS
        # ------------------------------------------------------

        print("\n" + "=" * 70)
        print("4. BASIC NUMERIC STATISTICS")
        print("=" * 70)

        print(
            df[
                [
                    "year",
                    "area",
                    "production"
                ]
            ].describe()
        )

        # ------------------------------------------------------
        # UNIQUE CATEGORIES
        # ------------------------------------------------------

        print("\n" + "=" * 70)
        print("5. CATEGORY COUNTS")
        print("=" * 70)

        print("Districts:",
              df["district"].nunique())

        print("Crops:",
              df["crop"].nunique())

        print("Seasons:",
              df["season"].nunique())

        print("Years:",
              df["year"].nunique())

        print("\nYear range:",
              int(df["year"].min()),
              "-",
              int(df["year"].max()))

        # ------------------------------------------------------
        # AREA VS PRODUCTION CORRELATION
        # ------------------------------------------------------

        print("\n" + "=" * 70)
        print("6. AREA VS PRODUCTION")
        print("=" * 70)

        correlation = df[
            ["area", "production"]
        ].corr().iloc[0, 1]

        print(
            "Pearson correlation:",
            round(float(correlation), 4)
        )

        if abs(correlation) >= 0.8:
            print(
                "Interpretation: STRONG relationship "
                "between area and production."
            )

        elif abs(correlation) >= 0.5:
            print(
                "Interpretation: MODERATE relationship "
                "between area and production."
            )

        else:
            print(
                "Interpretation: WEAK relationship "
                "between area and production."
            )

        # ------------------------------------------------------
        # CALCULATE YIELD
        # ------------------------------------------------------

        df["yield_per_area"] = (
            df["production"] /
            df["area"]
        )

        df["yield_per_area"] = (
            df["yield_per_area"]
            .replace(
                [np.inf, -np.inf],
                np.nan
            )
        )

        df = df.dropna(
            subset=["yield_per_area"]
        )

        print("\n" + "=" * 70)
        print("7. YIELD STATISTICS")
        print("=" * 70)

        print(
            df["yield_per_area"].describe(
                percentiles=[
                    0.01,
                    0.05,
                    0.25,
                    0.50,
                    0.75,
                    0.95,
                    0.99
                ]
            )
        )

        # ------------------------------------------------------
        # YIELD OUTLIERS USING IQR
        # ------------------------------------------------------

        print("\n" + "=" * 70)
        print("8. YIELD OUTLIERS")
        print("=" * 70)

        q1 = df["yield_per_area"].quantile(0.25)
        q3 = df["yield_per_area"].quantile(0.75)

        iqr = q3 - q1

        lower_bound = q1 - (1.5 * iqr)
        upper_bound = q3 + (1.5 * iqr)

        yield_outliers = df[
            (df["yield_per_area"] < lower_bound)
            |
            (df["yield_per_area"] > upper_bound)
        ]

        print("Q1:", round(float(q1), 4))
        print("Q3:", round(float(q3), 4))
        print("IQR:", round(float(iqr), 4))

        print(
            "Lower bound:",
            round(float(lower_bound), 4)
        )

        print(
            "Upper bound:",
            round(float(upper_bound), 4)
        )

        print(
            "Yield outliers:",
            len(yield_outliers)
        )

        print(
            "Outlier percentage:",
            round(
                len(yield_outliers)
                / len(df)
                * 100,
                2
            ),
            "%"
        )

        # ------------------------------------------------------
        # CROP-WISE YIELD
        # ------------------------------------------------------

        print("\n" + "=" * 70)
        print("9. CROP-WISE YIELD")
        print("=" * 70)

        crop_stats = (
            df.groupby("crop")
            ["yield_per_area"]
            .agg(
                [
                    "count",
                    "mean",
                    "median",
                    "std",
                    "min",
                    "max"
                ]
            )
            .sort_values(
                "mean",
                ascending=False
            )
        )

        print(crop_stats.to_string())

        # ------------------------------------------------------
        # DISTRICT-WISE YIELD
        # ------------------------------------------------------

        print("\n" + "=" * 70)
        print("10. DISTRICT-WISE YIELD")
        print("=" * 70)

        district_stats = (
            df.groupby("district")
            ["yield_per_area"]
            .agg(
                [
                    "count",
                    "mean",
                    "median",
                    "std"
                ]
            )
            .sort_values(
                "mean",
                ascending=False
            )
        )

        print(district_stats.to_string())

        # ------------------------------------------------------
        # SEASON-WISE YIELD
        # ------------------------------------------------------

        print("\n" + "=" * 70)
        print("11. SEASON-WISE YIELD")
        print("=" * 70)

        season_stats = (
            df.groupby("season")
            ["yield_per_area"]
            .agg(
                [
                    "count",
                    "mean",
                    "median",
                    "std"
                ]
            )
            .sort_values(
                "mean",
                ascending=False
            )
        )

        print(season_stats.to_string())

        # ------------------------------------------------------
        # YEAR-WISE YIELD
        # ------------------------------------------------------

        print("\n" + "=" * 70)
        print("12. YEAR-WISE YIELD")
        print("=" * 70)

        year_stats = (
            df.groupby("year")
            ["yield_per_area"]
            .agg(
                [
                    "count",
                    "mean",
                    "median",
                    "std"
                ]
            )
            .sort_index()
        )

        print(year_stats.to_string())

        # ------------------------------------------------------
        # WITHIN-GROUP VARIABILITY
        # ------------------------------------------------------

        print("\n" + "=" * 70)
        print("13. DISTRICT + CROP + SEASON VARIABILITY")
        print("=" * 70)

        group_stats = (
            df.groupby(
                [
                    "district",
                    "crop",
                    "season"
                ]
            )
            ["yield_per_area"]
            .agg(
                [
                    "count",
                    "mean",
                    "std"
                ]
            )
            .reset_index()
        )

        valid_groups = group_stats[
            group_stats["count"] >= 10
        ].copy()

        valid_groups["coefficient_of_variation"] = (
            valid_groups["std"] /
            valid_groups["mean"].replace(
                0,
                np.nan
            )
        )

        print(
            "Total groups:",
            len(group_stats)
        )

        print(
            "Groups with >= 10 records:",
            len(valid_groups)
        )

        if not valid_groups.empty:

            print(
                "\nMedian within-group coefficient "
                "of variation:",
                round(
                    float(
                        valid_groups[
                            "coefficient_of_variation"
                        ].median()
                    ),
                    4
                )
            )

        # ------------------------------------------------------
        # PRODUCTION OUTLIERS
        # ------------------------------------------------------

        print("\n" + "=" * 70)
        print("14. PRODUCTION OUTLIERS")
        print("=" * 70)

        prod_q1 = df["production"].quantile(0.25)
        prod_q3 = df["production"].quantile(0.75)

        prod_iqr = prod_q3 - prod_q1

        prod_lower = max(
            0,
            prod_q1 - 1.5 * prod_iqr
        )

        prod_upper = (
            prod_q3 + 1.5 * prod_iqr
        )

        production_outliers = df[
            (df["production"] < prod_lower)
            |
            (df["production"] > prod_upper)
        ]

        print(
            "Production outliers:",
            len(production_outliers)
        )

        print(
            "Production outlier percentage:",
            round(
                len(production_outliers)
                / len(df)
                * 100,
                2
            ),
            "%"
        )

        # ------------------------------------------------------
        # MOST COMMON COMBINATIONS
        # ------------------------------------------------------

        print("\n" + "=" * 70)
        print("15. MOST COMMON CROP/DISTRICT/SEASON GROUPS")
        print("=" * 70)

        common_groups = (
            df.groupby(
                [
                    "district",
                    "crop",
                    "season"
                ]
            )
            .size()
            .reset_index(
                name="records"
            )
            .sort_values(
                "records",
                ascending=False
            )
            .head(20)
        )

        print(common_groups.to_string(index=False))

        # ------------------------------------------------------
        # FINAL SUMMARY
        # ------------------------------------------------------

        print("\n" + "=" * 70)
        print("16. AUTOMATIC SUMMARY")
        print("=" * 70)

        print(
            f"Clean records: {len(df)}"
        )

        print(
            f"Area-production correlation: "
            f"{correlation:.4f}"
        )

        print(
            f"Yield outliers: "
            f"{len(yield_outliers)} "
            f"({len(yield_outliers)/len(df)*100:.2f}%)"
        )

        if not valid_groups.empty:

            median_cv = (
                valid_groups[
                    "coefficient_of_variation"
                ].median()
            )

            print(
                "Median within-group yield CV:",
                round(float(median_cv), 4)
            )

            if median_cv > 0.50:

                print(
                    "\nWARNING:"
                    "\nYield varies heavily even for the same "
                    "district/crop/season combination."
                    "\nThis can limit ML prediction accuracy "
                    "unless additional explanatory features exist."
                )

        print("\nAnalysis completed.")
        print("=" * 70)


if __name__ == "__main__":
    analyze_training_data()