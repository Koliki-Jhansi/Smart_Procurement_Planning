from flask import Blueprint, request, jsonify
import math


transport_bp = Blueprint(
    "transport",
    __name__,
    url_prefix="/api/transport"
)


VEHICLES = {

    "Mini Truck": {
        "capacity": 3,
        "efficiency": 7
    },

    "Medium Truck": {
        "capacity": 7,
        "efficiency": 5.5
    },

    "Large Truck": {
        "capacity": 10,
        "efficiency": 4
    },

    "Heavy Truck": {
        "capacity": 20,
        "efficiency": 3
    }

}


FUEL_PRICE = 100

DRIVER_COST_PER_TRIP = 800

LOADING_COST_PER_TON = 100

UNLOADING_COST_PER_TON = 100


@transport_bp.route(
    "/calculate",
    methods=["POST"]
)
def calculate_transport():

    try:

        data = request.get_json(
            silent=True
        ) or {}

        print("")
        print("========================================")
        print("TRANSPORT CALCULATION REQUEST")
        print("========================================")
        print(data)
        print("========================================")
        print("")

        quantity = float(
            data.get(
                "quantity",
                0
            )
        )

        distance = float(
            data.get(
                "distance",
                0
            )
        )

        vehicle_name = str(
            data.get(
                "vehicle",
                "Medium Truck"
            )
        ).strip()

        if quantity <= 0:

            return jsonify({

                "success": False,

                "message":
                    "Quantity must be greater than zero."

            }), 400

        if distance <= 0:

            return jsonify({

                "success": False,

                "message":
                    "Distance must be greater than zero."

            }), 400

        if vehicle_name not in VEHICLES:

            return jsonify({

                "success": False,

                "message":
                    "Invalid vehicle selected."

            }), 400

        vehicle = VEHICLES[
            vehicle_name
        ]

        vehicle_capacity = float(
            vehicle["capacity"]
        )

        fuel_efficiency = float(
            vehicle["efficiency"]
        )

        trips = math.ceil(
            quantity / vehicle_capacity
        )

        total_distance = (
            distance
            * 2
            * trips
        )

        fuel_required = (
            total_distance
            / fuel_efficiency
        )

        fuel_cost = (
            fuel_required
            * FUEL_PRICE
        )

        driver_cost = (
            DRIVER_COST_PER_TRIP
            * trips
        )

        loading_cost = (
            quantity
            * LOADING_COST_PER_TON
        )

        unloading_cost = (
            quantity
            * UNLOADING_COST_PER_TON
        )

        total_cost = (

            fuel_cost
            + driver_cost
            + loading_cost
            + unloading_cost

        )

        cost_per_ton = (
            total_cost
            / quantity
        )

        response = {

            "success": True,

            "vehicle":
                vehicle_name,

            "vehicleCapacity":
                vehicle_capacity,

            "distance":
                round(
                    distance,
                    2
                ),

            "trips":
                trips,

            "totalDistance":
                round(
                    total_distance,
                    2
                ),

            "fuelRequired":
                round(
                    fuel_required,
                    2
                ),

            "fuelCost":
                round(
                    fuel_cost,
                    2
                ),

            "driverCost":
                round(
                    driver_cost,
                    2
                ),

            "loadingCost":
                round(
                    loading_cost,
                    2
                ),

            "unloadingCost":
                round(
                    unloading_cost,
                    2
                ),

            "totalCost":
                round(
                    total_cost,
                    2
                ),

            "costPerTon":
                round(
                    cost_per_ton,
                    2
                )

        }

        print("✅ TRANSPORT CALCULATED")
        print(response)

        return jsonify(
            response
        ), 200


    except (
        ValueError,
        TypeError
    ):

        return jsonify({

            "success": False,

            "message":
                "Invalid quantity or distance."

        }), 400


    except Exception as error:

        print(
            "❌ Transport calculation error:",
            str(error)
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to calculate transport cost.",

            "error":
                str(error)

        }), 500